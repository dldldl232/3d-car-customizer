FROM python:3.12-slim

WORKDIR /app

# bring in distutils so Poetry can bootstrap correctly
RUN apt-get update \
    && apt-get install -y python3-distutils \
    && rm -rf /var/lib/apt/lists/*

# copy dependency specs
COPY pyproject.toml poetry.lock* /app/

# install dependencies only (skip installing the project itself)
RUN pip install poetry \
    && poetry config virtualenvs.create false \
    && poetry install --without dev --no-root

# copy app code
COPY ./app /app/app

# launch
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
