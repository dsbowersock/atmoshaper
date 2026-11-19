# One-shot backup tooling, not a database server or scheduler. Pin the public
# parent and age archive before handling any private database input.
FROM postgres:18.7-trixie@sha256:2ea8630df176ad090ec92136dee850397c5af8781e4bcf2e4162593691c61bbc

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN curl --fail --location --silent --show-error \
      https://github.com/FiloSottile/age/releases/download/v1.3.2/age-v1.3.2-linux-amd64.tar.gz \
      --output /tmp/age.tar.gz \
    && echo 'cbe24006683f8eb669266162894b9a522a1af52f2665fbc63a4bb032ed26ac10  /tmp/age.tar.gz' | sha256sum --check --status \
    && tar -xzf /tmp/age.tar.gz -C /tmp \
    && install -m 0755 /tmp/age/age /usr/local/bin/age \
    && rm -rf /tmp/age /tmp/age.tar.gz

COPY backup.py /app/backup.py
# Private NAS build inputs can be mode 0600; COPY retains that mode while making
# root the owner. Public code must remain readable by the unprivileged job user.
RUN chmod 0644 /app/backup.py
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
USER 65534:65534
WORKDIR /app
ENTRYPOINT ["python3", "/app/backup.py"]
CMD ["plan"]
