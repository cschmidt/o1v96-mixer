sudo apt update

curl -fsSL https://deb.nodesource.com/setup_21.x | sudo -E bash - &&\
sudo apt-get install -y nodejs

# If no native build for the usb NPM is available then:
sudo apt-get install build-essential libudev-dev

Setting up as a service

