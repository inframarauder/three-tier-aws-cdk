import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { InstanceClass, InstanceSize, InstanceType, Peer, Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import * as Types from '../types';
import { AuroraPostgresEngineVersion, ClusterInstance, Credentials, DatabaseCluster, DatabaseClusterEngine } from 'aws-cdk-lib/aws-rds';
import { Cluster } from 'aws-cdk-lib/aws-ecs';

export interface DatabaseStackProps extends StackProps {
    environment: Types.ENVIRONMENT;
    vpc: Vpc;
    clusterNamePrefix: string;
    defaultDBName: string;
    masterUsername: string;
    instanceType: string;
}

export interface DatabaseStackOutputs {
    clusterEndpoint: string;
    clusterIdentifier: string;
    rdsSecurityGroup: SecurityGroup;
}

export class DatabaseStack extends Stack {
    private readonly cluster;
    private readonly rdsSecurityGroup;

    constructor(scope: Construct, id: string, props: DatabaseStackProps) {
        super(scope, id, props);

        // create RDS security group
        this.rdsSecurityGroup = new SecurityGroup(this, "RdsSecurityGroup", {
            vpc: props.vpc,
            description: "Allow ECS Access to Postgres",
            allowAllOutbound: false,
        });

        // create RDS Cluster
        this.cluster = new DatabaseCluster(this, "RdsCluster", {
            engine: DatabaseClusterEngine.auroraPostgres({
                version: AuroraPostgresEngineVersion.VER_17_4 // latest available
            }),
            credentials: Credentials.fromUsername(props.masterUsername),
            defaultDatabaseName: props.defaultDBName,
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
            rdsSecurityGroup: this.rdsSecurityGroup
        };
    }
    // method to update RDS Security Group with bastion's SG
    whiteListBastion(bastionSG: SecurityGroup): void {
        const bastionSgId = bastionSG.securityGroupId;
        const rdsPort = this.cluster.clusterEndpoint.port;
        this.rdsSecurityGroup.addIngressRule(Peer.securityGroupId(bastionSgId), Port.tcp(rdsPort));
    }
}