#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import * as DevConfigs from '../environments/dev';

// create CDK app
const app = new cdk.App();

// define and apply default tags
cdk.Tags.of(app).add('aws-cdk', 'true');
cdk.Tags.of(app).add('auto-destroy', 'true'); // needed for lambda to auto destroy resources, in case i forget!!

// create NetworkStack
new NetworkStack(app, 'NetworkStack', DevConfigs.NetworkStackProps);