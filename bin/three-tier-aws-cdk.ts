#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import * as DevConfigs from '../environments/dev';

const app = new cdk.App();

// create NetworkStack
new NetworkStack(app, 'NetworkStack', DevConfigs.NetworkStackProps);