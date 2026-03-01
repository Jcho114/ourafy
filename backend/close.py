import os
import signal
import subprocess

DISTRACTIONS_LIST = [
    "Minecraft",
    "Roblox",
    "Polytopia",
    "Steam",
    "Discord",
    "Instagram",
]

PRODUCTIVE_APP_LIST = [
    "Google Chrome",
    "Firefox",
    "Safari",
    "VSCode",
    "Obsidian",
    "Notion",
]


def kill_running_processes(list=DISTRACTIONS_LIST):
    try:
        output = subprocess.check_output(["ps", "-ax", "-o", "pid,command"]).decode(
            "utf-8"
        )
        lines = output.strip().split("\n")[1:]

        for line in lines:
            parts = line.strip().split(None, 1)
            if len(parts) < 2:
                continue
            pid = int(parts[0])
            cmd = parts[1]

            for app in list:
                if app in cmd:
                    print(f"Found distraction '{app}' running (PID {pid}). Killing...")
                    try:
                        os.kill(pid, signal.SIGKILL)
                    except PermissionError:
                        print(f"Permission denied: cannot kill PID {pid}")
                    break

    except subprocess.CalledProcessError as e:
        print(f"Error executing ps command: {e}")
    except ValueError as e:
        print(f"Error parsing process info: {e}")
