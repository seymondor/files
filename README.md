readme

## Лабораторная работа № 6

[![Deploy static site](https://github.com/seymondor/files/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/seymondor/files/actions/workflows/deploy.yml)

[Путеводитель по корпусам ГУАП](https://seymondor.github.io/files/lab6/) · [Исходники](lab6/)

При изменениях в ветке `main` GitHub Actions собирает статические файлы,
проверяет HTML, локальные файлы и якоря путеводителя, затем публикует артефакт
на GitHub Pages. Для запуска с компьютера достаточно открыть `lab6/index.html`.

[Схемы аудиторий](https://seymondor.github.io/files/lab6/auditoriums.html) ведут на
официальные планы четырёх учебных корпусов. Файл `lab6/build-info.json`
в артефакте `github-pages` содержит SHA коммита и номер запуска GitHub Actions.
