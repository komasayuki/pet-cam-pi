# Internet Pet Camera for Raspberry pi using SkyWay

The world's easiest pet camera with pan control that can be viewed from the Internet.

[日本語の説明もあります](https://qiita.com/komasayuki/items/1caef300977efa5d5981)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for testing.

### Prerequisites

A SkyWay account is required.
You can [create an account](https://console.skyway.ntt.com/signup/) for free.

Hardware

- Raspberry Pi
- USB Camera
- Servo

Wiring

- Pi 2pin (5V Power) -> Servo VCC
- Pi 6pin (Ground) -> Servo GND
- Pi 12pin (GPIO 18) -> Servo SIGNAL

Software

- [node, npm](https://nodejs.org/en/download)



### Create SkyWay project and application

- [Login SkyWay](https://console.skyway.ntt.com/login/)
- Create Project
- Create Application
- Keep the displayed `Application ID` and `Secret`

### Build

```bash
% git clone https://github.com/komasayuki/pet-cam
% cd pet-cam

% npm install

% npm run build
# index.html and javascript in ./dist
```


### Run pet-cam-pi server on Raspberry Pi

```bash
# clone pet-cam repository from GitHub
% git clone https://github.com/komasayuki/pet-cam-pi

% cd pet-cam-pi/server

# first time only
% npm install

# launch pet-cam-pi server on port 8080
% sudo npm start
```

Now you can open Camera web page by Raspberry pi's web browser.

Camera side URL:
http://localhost:8080/index.html?camera=true&audio=true



### Deploy to GitHub Pages

You can invoke `Deploy to GitHub Pages` GitHub Actions manually.
Push `Run workflow` of `Deploy to GitHub Pages` in GitHub Actions.
You can access the web page on GitHub Pages.

Viewer side URL:
https://komasayuki.github.io/pet-cam-pi/index.html?camera=false


## Note

WebRTC is only available on iOS devices from pages hosted over https.
This repository was made from [SkyWay's p2p room example](https://github.com/skyway/js-sdk/tree/main/examples/p2p-room).