import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { InstanceType, SecurityGroup, SubnetType, Vpc, Peer, Port } from 'aws-cdk-lib/aws-ec2';
import * as Types from '../types';
import { AuroraPostgresEngineVersion, ClusterInstance, Credentials, DatabaseCluster, DatabaseClusterEngine } from 'aws-cdk-lib/aws-rds';

export interface DatabaseStackProps extends StackProps {
    environment: Types.ENVIRONMENT;
    vpc: Vpc;
    clusterNamePrefix: string;
    instanceType: string;
}

export interface DatabaseStackOutputs {
    clusterEndpoint: string;
    clusterIdentifier: string;
    rdsSecurityGroup: SecurityGroup;
    bastionSG: SecurityGroup;
}

export class DatabaseStack extends Stack {
    private readonly cluster;
    private readonly rdsSecurityGroup;
    private readonly bastionSG;

    constructor(scope: Construct, id: string, props: DatabaseStackProps) {
        super(scope, id, props);

        // create RDS security group
        this.rdsSecurityGroup = new SecurityGroup(this, "RdsSecurityGroup", {
            vpc: props.vpc,
            description: "Allow ECS Access to Postgres",
            allowAllOutbound: false,
        });

        // create bastion security group - here to avoid cyclic dependencies
        this.bastionSG = new SecurityGroup(this, 'BastionSG', {
            vpc: props.vpc,
            description: "Allow SSH access to bastion host from sepcific IP(s)",
        });

        // whitelist bastion in RDS SG
        this.rdsSecurityGroup.addIngressRule(
            Peer.securityGroupId(this.bastionSG.securityGroupId),
            Port.tcp(5432),
            "Allow Bastion to access RDS"
        );

        // create RDS Cluster
        this.cluster = new DatabaseCluster(this, "RdsCluster", {
            engine: DatabaseClusterEngine.auroraPostgres({
                version: AuroraPostgresEngineVersion.VER_17_4 // latest available
            }),
            vpc: props.vpc,
            vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED }, // place RDS instances in air-gapped subnets
            iamAuthentication: true, // to be used by ECS tasks
            writer: ClusterInstance.provisioned('ClusterInstance', {
                instanceType: new InstanceType(props.instanceType)
            })
        });

    }

    // return necessary outputs
    getOutputs(): DatabaseStackOutputs {
        return {
            clusterEndpoint: this.cluster.clusterEndpoint.socketAddress,
            clusterIdentifier: this.cluster.clusterIdentifier,
            rdsSecurityGroup: this.rdsSecurityGroup,
            bastionSG: this.bastionSG
        };
    }
}