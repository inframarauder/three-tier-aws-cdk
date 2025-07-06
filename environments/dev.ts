import { ENVIRONMENT } from '../types';

export default {
    NetworkStackProps: {
        environment: 'dev' as ENVIRONMENT,
        vpcNamePrefix: 'three-tier-app',
        vpcCidrIPv4: '10.0.0.0/16',
        publicSubnetCidrMask: 24,
        privateSubnetCidrMask: 24,
        databaseSubnetCidrMask: 28,
        maxAZs: 2,
        numNatGateways: 1,
    },
    DatabaseStackProps: {
        environment: 'dev' as ENVIRONMENT,
        clusterNamePrefix: "three-tier-app",
        instanceType: "t3.medium"
    },
    BastionStackProps: {
        environment: 'dev' as ENVIRONMENT,
        instanceType: "t3.micro",
        sshKeyName: "ssh-ap-south-1",// hardcoding for now - already exists in my AWS account
        sshWhitelistedCidr: "27.7.149.214/32", // hardcoding for now
        ubuntuAmiSSMParam: "/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id" // hardcoding for now
    }
};