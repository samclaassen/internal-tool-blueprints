#!/usr/bin/env python3
"""Stage a video on a public GitHub repo's "media" branch so a browser page can fetch it with CORS.

raw.githubusercontent.com answers with Access-Control-Allow-Origin: *, so a script running inside
studio.youtube.com can download the file into a Blob and hand it to YouTube's uploader.

Usage: python3 stage_video.py <owner/repo> <local-video-path> <target-filename>
Needs git, curl and an authenticated gh CLI with push access to a PUBLIC repo.
Prints one JSON line: {"url": ..., "bytes": N} on success, {"error": ...} with exit code 1 otherwise.
Safe to re-run: an identical file is not committed again.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time


def sh(*args, cwd=None, check=True, env=None):
    r = subprocess.run(args, cwd=cwd, env=env, capture_output=True, text=True)
    if check and r.returncode != 0:
        raise RuntimeError(f"{' '.join(args[:3])} failed: {r.stderr.strip()[:300]}")
    return r


def fail(msg):
    print(json.dumps({"error": msg}))
    sys.exit(1)


def main(argv):
    if len(argv) != 4:
        fail("usage: stage_video.py <owner/repo> <local-video-path> <target-filename>")
    repo, src, name = argv[1:4]
    if not os.path.isfile(src):
        fail(f"no file at {src}")
    if not re.fullmatch(r"[A-Za-z0-9._-]+", name):
        fail("target filename may only use letters, digits, dot, dash, underscore")
    size = os.path.getsize(src)
    if size >= 100_000_000:
        fail("GitHub rejects files over 100 MB")
    vis = sh("gh", "api", f"repos/{repo}", "--jq", ".visibility").stdout.strip()
    if vis != "public":
        fail(f"{repo} is {vis}; raw links need a public repo")

    login = sh("gh", "api", "user", "--jq", ".login").stdout.strip()
    uid = sh("gh", "api", "user", "--jq", ".id").stdout.strip()
    uname = sh("gh", "api", "user", "--jq", ".name // .login").stdout.strip() or login
    env = dict(os.environ)
    env.setdefault("GIT_AUTHOR_NAME", uname)
    env.setdefault("GIT_AUTHOR_EMAIL", f"{uid}+{login}@users.noreply.github.com")
    env.setdefault("GIT_COMMITTER_NAME", env["GIT_AUTHOR_NAME"])
    env.setdefault("GIT_COMMITTER_EMAIL", env["GIT_AUTHOR_EMAIL"])

    work = tempfile.mkdtemp()
    try:
        url = f"https://github.com/{repo}.git"
        d = os.path.join(work, "r")
        has_media = sh("git", "ls-remote", "--exit-code", "--heads", url, "media", check=False).returncode == 0
        if has_media:
            sh("git", "clone", "-q", "--depth", "1", "--branch", "media", url, d)
        else:
            sh("git", "clone", "-q", "--depth", "1", url, d)
            sh("git", "checkout", "-q", "--orphan", "media", cwd=d)
            sh("git", "rm", "-rqf", "--cached", ".", cwd=d)
            for entry in os.listdir(d):
                if entry != ".git":
                    p = os.path.join(d, entry)
                    shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
            with open(os.path.join(d, "README.md"), "w") as f:
                f.write("# Media\n\nVideo files used by this project's outreach. The main branch is unaffected.\n")
        shutil.copyfile(src, os.path.join(d, name))
        sh("git", "add", "-A", cwd=d)
        if sh("git", "diff", "--cached", "--quiet", cwd=d, check=False).returncode != 0:
            sh("git", "commit", "-q", "-m", f"Media: {name}", cwd=d, env=env)
            sh("git", "push", "-q", "origin", "media", cwd=d)
    finally:
        shutil.rmtree(work, ignore_errors=True)

    raw = f"https://raw.githubusercontent.com/{repo}/media/{name}"
    code, got = "000", "0"
    for i in range(30):  # raw.githubusercontent.com can take a minute to see a new branch or file
        r = sh("curl", "-s", "-o", "/dev/null", "-w", "%{http_code} %{size_download}", f"{raw}?v={i}", check=False)
        code, got = (r.stdout.split() + ["000", "0"])[:2]
        if code == "200" and got == str(size):
            print(json.dumps({"url": raw, "bytes": size}))
            return 0
        time.sleep(10)
    fail(f"pushed, but {raw} is not serving the full file yet (last HTTP {code}, {got} bytes)")


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv))
    except RuntimeError as e:
        fail(str(e))
