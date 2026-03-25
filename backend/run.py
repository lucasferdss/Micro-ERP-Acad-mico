"""
ARQUIVO: run.py
PAPEL: Ponto de entrada (Entrypoint) do Backend.
FLUXO: Configura o caminho do projeto e dá a ordem de iniciar o servidor HTTP.
COMO SE ENCAIXA: É o arquivo principal que você roda no terminal (`python run.py`) para ligar o sistema.
"""

import os
import sys

# Passo 1: Adiciona o diretório atual ao caminho do Python
# Motivo: Garante que o Python consiga encontrar a pasta 'app' para importar os módulos,
# independentemente de onde o terminal foi aberto.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Importa a função que liga o nosso servidor, lá do arquivo server.py
from app.server import run_server

# Passo 2: Execução principal
# Regra: Só inicia o servidor se este arquivo for rodado DIRETAMENTE (não via importação de outro arquivo)
if __name__ == "__main__":
    # Chama a função run_server definindo a porta padrão 8080
    run_server(port=8080)
