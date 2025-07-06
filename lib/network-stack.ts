import { Stack, StackProps } from 'aws-cdk-lib';
import { Vpc, SubnetConfiguration, SubnetType, IpAddresses } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import * as Types from '../types';

export interface NetworkStackProps extends StackProps {
    environment: Types.ENVIRONMENT;
    vpcNamePrefix: string;
    vpcCidrIPv4: string;
    publicSubnetCidrMask: number;
    privateSubnetCidrMask: number;
    databaseSubnetCidrMask: number;
    maxAZs: number;
    numNatGateways: number;
}

export interface NetworkStackOutputs {
    vpc: Vpc;
}

export class NetworkStack extends Stack {
    private readonly vpc: Vpc;

    constructor(scope: Construct, id: string, props: NetworkStackProps) {
        super(scope, id, props);

        // define subnet configurations
        const subnetConfiguration: SubnetConfiguration[] = [
            {
                name: "Public",
                subnetType: SubnetType.PUBLIC,
                cidrMask: props.publicSubnetCidrMask
            },
            {
                name: "Private-App",
                subnetType: SubnetType.PRIVATE_WITH_EGRESS,
                cidrMask: props.privateSubnetCidrMask
            },
            {
                name: "Private-DB",
                subnetType: SubnetType.PRIVATE_ISOLATED,
                cidrMask: props.databaseSubnetCidrMask
            }
        ];

        // create VPC with subnet configs
        this.vpc = new Vpc(this, 'ThreeTierVpc', {
            vpcName: `${props.vpcNamePrefix}-${props.environment}`,
            ipAddresses: IpAddresses.cidr(props.vpcCidrIPv4),
            maxAzs: props.maxAZs,
            natGateways: props.numNatGateways,
            subnetConfiguration
        });
    }

    // return stack outputs
    getOutputs(): NetworkStackOutputs {
        return {
            vpc: this.vpc
        };
    };
}
