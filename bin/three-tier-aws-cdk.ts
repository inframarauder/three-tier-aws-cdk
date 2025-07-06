#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import DevConfigs from '../environments/dev';

// create CDK app
const app = new cdk.App();

// define and apply default tags
cdk.Tags.of(app).add('aws-cdk', 'true');
cdk.Tags.of(app).add('auto-destroy', 'true'); // needed for lambda to auto destroy resources, in case i forget!!

// method to provision entire infra via all the stacks
const provisionInfra = (configs: any): void => {
    // create NetworkStack
    new NetworkStack(app, 'NetworkStack', configs.NetworkStackProps);
};

//dev infra goes here
provisionInfra(DevConfigs);