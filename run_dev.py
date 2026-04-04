import os
import shutil
import subprocess
import sys
import time


def _require_command(name: str, install_hint: str) -> bool:
    if shutil.which(name):
        return True
    print(f"[Missing] `{name}` not found in PATH.")
    print(f"          {install_hint}")
    return False


def _stop_process(proc: subprocess.Popen, label: str) -> None:
    if proc.poll() is not None:
        return

    print(f"Stopping {label}...")
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()


def start_services() -> None:
    root = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root, "frontend")
    backend_dir = os.path.join(root, "backend")

    print("Starting 0xRIP split stack...")

    ok = True
    ok &= _require_command("bun", "Install Bun: https://bun.sh")
    ok &= _require_command("uv", "Install uv: https://docs.astral.sh/uv/getting-started/installation/")

    if not os.path.isdir(frontend_dir):
        print(f"[Missing] frontend directory: {frontend_dir}")
        ok = False
    if not os.path.isdir(backend_dir):
        print(f"[Missing] backend directory: {backend_dir}")
        ok = False

    if not ok:
        sys.exit(1)

    backend_cmd = [
        "uv",
        "run",
        "uvicorn",
        "backend.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
        "--reload",
    ]

    frontend_cmd = [
        "bun",
        "run",
        "dev",
        "--",
        "--host",
        "0.0.0.0",
        "--port",
        "5173",
    ]

    print("Starting backend (uv + FastAPI) on :8000 ...")
    backend_process = subprocess.Popen(backend_cmd, cwd=root)

    time.sleep(1.5)

    print("Starting frontend (bun + Vite) on :5173 ...")
    frontend_process = subprocess.Popen(frontend_cmd, cwd=frontend_dir)

    print("\nServices started:")
    print("- Frontend: http://localhost:5173")
    print("- Backend : http://localhost:8000")
    print("Press Ctrl+C to stop.")

    try:
        while True:
            if backend_process.poll() is not None:
                print("Backend exited unexpectedly.")
                break
            if frontend_process.poll() is not None:
                print("Frontend exited unexpectedly.")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nReceived Ctrl+C. Shutting down...")
    finally:
        _stop_process(frontend_process, "frontend")
        _stop_process(backend_process, "backend")
        print("Bye.")


if __name__ == "__main__":
    start_services()
