"""
Orquestador de Servicios de Alta Disponibilidad
Sistema Inteligente de Gestión y Análisis Documental - UTS
Puertos Seguros:
  - Backend REST & WebSocket: 8080
  - Frontend Web (React Vite): 5180
"""

import os
import sys
import subprocess
import time
import signal

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(CURRENT_DIR, "frontend")

def run():
    print("=" * 70)
    print("  [+] INICIANDO PLATAFORMA DOCUMENTAL COGNITIVA UTS (PUERTOS SEGUROS)")
    print("  * Backend REST & WebSocket: http://127.0.0.1:8080 (Docs: /docs)")
    print("  * Frontend Web React:       http://localhost:5180")
    print("=" * 70)

    # Iniciar Backend
    backend_env = os.environ.copy()
    backend_env["APP_PORT"] = "8080"
    backend_cmd = [sys.executable, "-u", os.path.join(CURRENT_DIR, "backend", "main.py")]

    print("[1/2] Iniciando Backend FastAPI en puerto 8080...")
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=CURRENT_DIR,
        env=backend_env,
        stdin=subprocess.DEVNULL
    )

    time.sleep(2)

    # Iniciar Frontend
    # Usar npx vite con flags para evitar cierre por stdin
    print("[2/2] Iniciando Frontend Vite en puerto 5180...")
    if sys.platform == "win32":
        frontend_cmd = "npx vite --host 0.0.0.0 --port 5180"
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=FRONTEND_DIR,
            shell=True,
            stdin=subprocess.DEVNULL
        )
    else:
        frontend_cmd = ["npx", "vite", "--host", "0.0.0.0", "--port", "5180"]
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=FRONTEND_DIR,
            stdin=subprocess.DEVNULL
        )

    print("\n[OK] Ambos servicios se encuentran operativos en segundo plano.")
    print("Accede en tu navegador a: http://localhost:5180\n")

    def shutdown(signum, frame):
        print("\nDeteniendo servicios...")
        try:
            backend_proc.terminate()
            frontend_proc.terminate()
        except Exception:
            pass
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Bucle de supervisión y mantenimiento de conexión
    while True:
        time.sleep(5)
        # Verificar si backend sigue vivo
        if backend_proc.poll() is not None:
            print("⚠️ Backend reiniciándose para mantener alta disponibilidad...")
            backend_proc = subprocess.Popen(
                backend_cmd,
                cwd=CURRENT_DIR,
                env=backend_env,
                stdin=subprocess.DEVNULL
            )
        # Verificar si frontend sigue vivo
        if frontend_proc.poll() is not None:
            print("⚠️ Frontend reiniciándose para mantener alta disponibilidad...")
            frontend_proc = subprocess.Popen(
                frontend_cmd,
                cwd=FRONTEND_DIR,
                shell=(sys.platform == "win32"),
                stdin=subprocess.DEVNULL
            )

if __name__ == "__main__":
    run()
