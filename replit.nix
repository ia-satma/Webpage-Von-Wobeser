{ pkgs }: {
  # Las cargas de video se validan de forma estricta con ffprobe y ffmpeg antes
  # de entrar a App Storage. Declararlos aquí hace que formen parte del snapshot
  # de despliegue, no solo del entorno interactivo del proyecto.
  deps = [
    pkgs.ffmpeg
    pkgs.clamav
    pkgs.unzip
    pkgs.jq
    pkgs.postgresql_18
  ];
}
