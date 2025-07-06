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
    }
};