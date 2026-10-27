#!/usr/bin/env python3
"""Publish files to the `media` branch of a public GitHub repo and print their raw URLs.

raw.githubusercontent.com serves files with Access-Control-Allow-Origin: *, so a Remotion render
(<Audio src>, <Img src>) and in-page fetches in YouTube Studio can load them.

Usage: stage_media.py <owner/repo> <dest-folder> <file-or-folder> [...]
  dest-folder: path inside the media branch, e.g. audio/help-desk-v1 or thumbs ("." for the root)
  Folders are copied flat (their files, not subfolders).
Prints JSON: {"base": "<raw url of dest-folder>", "files": [{"url", "bytes"}]}

Needs gh authenticated with push access. Commits as the gh user's noreply address unless
GIT_AUTHOR_* is set. Refuses private repos and files of 100 MB or more. Re-running is safe.
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
        raise RuntimeError(f"{' '.join(args[:3])}... failed: {r.stderr.strip()[:400]}")
    return r


def fail(msg):
    print(json.dumps({"error": msg}))
    sys.exit(1)


def main(argv):
    if len(argv) < 4:
        fail("usage: stage_media.py <owner/repo> <dest-folder> <file-or-folder> [...]")
    repo, dest, srcs = argv[1], argv[2].strip("/"), argv[3:]
    if dest != "." and not re.fullmatch(r"[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*", dest) or ".." in dest.split("/"):
        fail("dest-folder may only use letters, digits, dot, dash, underscore and /")
    files = []
    for s in srcs:
        if os.path.isdir(s):
            files += [os.path.join(s, f) for f in sorted(os.listdir(s)) if os.path.isfile(os.path.join(s, f))]
        elif os.path.isfile(s):
            files.append(s)
        else:
            fail(f"no file or folder at {s}")
    for f in files:
        if not re.fullmatch(r"[A-Za-z0-9._-]+", os.path.basename(f)):
            fail(f"file name {os.path.basename(f)} may only use letters, digits, dot, dash, underscore")
        if os.path.getsize(f) >= 100_000_000:
            fail(f"{f}: GitHub rejects files over 100 MB")
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
        if sh("git", "ls-remote", "--exit-code", "--heads", url, "media", check=False).returncode == 0:
            sh("git", "clone", "-q", "--depth", "1", "--branch", "media", url, d)
        else:
            sh("git", "clone", "-q", "--depth", "1", url, d)
            sh("git", "checkout", "-q", "--orphan", "media", cwd=d)
            sh("git", "rm", "-rqf", "--cached", ".", cwd=d)
            for entry in os.listdir(d):
                if entry != ".git":
                    p = os.path.join(d, entry)
                    shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
            with open(os.path.join(d, "README.md"), "w") as fh:
                fh.write("# Media\n\nAudio, video and images used by this project's videos. The main branch is unaffected.\n")
        target = d if dest == "." else os.path.join(d, dest)
        os.makedirs(target, exist_ok=True)
        for f in files:
            shutil.copyfile(f, os.path.join(target, os.path.basename(f)))
        sh("git", "add", "-A", cwd=d)
        if sh("git", "diff", "--cached", "--quiet", cwd=d, check=False).returncode != 0:
            sh("git", "commit", "-q", "-m", f"Media: {dest} ({len(files)} files)", cwd=d, env=env)
            sh("git", "push", "-q", "origin", "media", cwd=d)
    finally:
        shutil.rmtree(work, ignore_errors=True)

    base = f"https://raw.githubusercontent.com/{repo}/media" + ("" if dest == "." else f"/{dest}")
    out = []
    for f in files:
        raw, size = f"{base}/{os.path.basename(f)}", os.path.getsize(f)
        code, got = "000", "0"
        for i in range(30):  # raw.githubusercontent.com can take a minute to serve a new file
            r = sh("curl", "-s", "-o", "/dev/null", "-w", "%{http_code} %{size_download}", f"{raw}?v={i}", check=False)
            code, got = (r.stdout.split() + ["000", "0"])[:2]
            if code == "200" and got == str(size):
                break
            time.sleep(10)
        else:
            fail(f"pushed, but {raw} is not serving the full file yet (last HTTP {code}, {got} bytes)")
        out.append({"url": raw, "bytes": size})
    print(json.dumps({"base": base, "files": out}))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv))
    except RuntimeError as e:
        fail(str(e))
