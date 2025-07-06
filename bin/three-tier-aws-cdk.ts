#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { DatabaseStack } from '../lib/database-stack';
import { BastionStack } from '../lib/bastion-stack';
import DevConfigs from '../environments/dev';


// create CDK app
const app = new cdk.App();

// define and apply default tags
cdk.Tags.of(app).add('aws-cdk', 'true');
cdk.Tags.of(app).add('auto-destroy', 'true'); // needed for lambda to auto destroy resources, in case i forget!!

// method to provision entire infra via all the stacks
const provisionInfra = (configs: any): void => {
    // create NetworkStack and get outputs
    const vpcStack = new NetworkStack(app, 'NetworkStack', {
        ...configs.NetworkStackProps
    });
    const vpcStackOutputs = vpcStack.getOutputs();

    // create DatabaseStack and get outputs
    const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
        ...configs.DatabaseStackProps,
        vpc: vpcStackOutputs.vpc
    });
    const databaseStackOutputs = databaseStack.getOutputs();

    // create BastionStack and get outputs
    const bastionStack = new BastionStack(app, 'BastionStack', {
        ...configs.BastionStackProps,
        vpc: vpcStackOutputs.vpc,
        rdsClusterIdentifier: databaseStackOutputs.clusterIdentifier,
        rdsClusterUsername: configs.DatabaseStackProps.masterUsername,
        rdsSecurityGroup: databaseStackOutputs.rdsSecurityGroup,
        rdsPort: parseInt(databaseStackOutputs.clusterEndpoint.split(":")[1])
    });
    const bastionStackOutputs = bastionStack.getOutputs();


    // Log required outputs
    new cdk.CfnOutput(bastionStack, 'BastionPublicIP', {
        value: bastionStackOutputs.bastionPubIp,
        description: 'Bastion Public IP'
    });
    new cdk.CfnOutput(bastionStack, 'BastionPublicDNS', {
        value: bastionStackOutputs.bastionPublicDnsName,
        description: 'Bastion Public DNS'
    });
    new cdk.CfnOutput(databaseStack, 'RDSClusterEndpoint', {
        value: databaseStackOutputs.clusterEndpoint,
        description: 'RDS Cluster Endpoint'
    });
};

//dev infra goes here
provisionInfra(DevConfigs);