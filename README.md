# KOLO CHANEL
#### Projekt na WEPPO

Wymagania:
* System oparty o Linux
* MongoDB
* npm/node

Inicjalizacja bazy danych:
```
./initdb.sh
```

Instalacja zależności:
```
cd kolochanel
npm install
```

Uruchamianie
```
cd kolochanel
PORT=<port dla serwera> npm start
```

Inne:

`python3 dbops.py dump` - zrzut bazy danych

`python3 dbops.py load` - alternatywna metoda wczytywaniania bazy danych

### Autorzy
* Zbigniew Drozd
* Krzysztof Boroński
