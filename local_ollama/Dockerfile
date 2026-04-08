# Dockerfile
FROM ollama/ollama:latest

# Устанавливаем нужные переменные окружения
ENV OLLAMA_KEEP_ALIVE=24h
ENV OLLAMA_HOST=0.0.0.0
ENV OLLAMA_ORIGINS=*

# Копируем скрипт автозагрузки модели
COPY pull-model.sh /usr/local/bin/pull-model.sh
RUN chmod +x /usr/local/bin/pull-model.sh

# Делаем скрипт точкой входа
ENTRYPOINT ["/usr/local/bin/pull-model.sh"]