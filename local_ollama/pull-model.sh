#!/bin/bash
echo "=== Запуск Ollama сервера ==="

# Запускаем Ollama в фоне
ollama serve &
OLLAMA_PID=$!

# Ждём, пока сервер полностью запустится
echo "Ожидание запуска Ollama сервера..."
sleep 8

# Загружаем модель (можно добавить несколько моделей)
echo "=== Загрузка модели gpt-oss:20b ==="
#ollama pull gpt-oss:20b
#ollama pull llama3.2:3b
#ollama pull qwen3:4b
ollama pull qwen2.5:1.5b


echo "=== Модель успешно загружена! ==="

# Если хочешь загрузить ещё модели — добавь сюда:
#ollama pull nomic-embed-text

# Ожидаем завершения процесса ollama serve
wait $OLLAMA_PID