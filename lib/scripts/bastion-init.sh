#!/bin/bash

set -eux

# update packages
sudo apt-get update -y

# set hostname
sudo hostnamectl set-hostname "${hostname}"

# install utilities
sudo apt-get install -y unzip curl

# install aws cli
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version

# install postgres
sudo apt-get install -y postgresql
