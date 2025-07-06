import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import * as Types from '../types';
import { AuroraPostgresEngineVersion, Credentials, DatabaseCluster, DatabaseClusterEngine } from 'aws-cdk-lib/aws-rds';

export interface DatabaseStackProps extends StackProps {
    environment: Types.ENVIRONMENT;
    vpc: Vpc;
    clusterNamePrefix: string;
    defaultDBName: string;
    masterUsername: string;
}

export interface DatabaseStackOutputs {
    readerEndpoint: string;
    writerEndpoint: string;
    clusterArn: string;
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
            iamAuthentication: true // to be used by ECS tasks
        });
    }

    // return necessary outputs
    getOutputs(): DatabaseStackOutputs {
        return {
            clusterArn: this.cluster.clusterArn,
            readerEndpoint: this.cluster.clusterReadEndpoint.socketAddress,
            writerEndpoint: this.cluster.clusterEndpoint.socketAddress,
            rdsSecurityGroup: this.rdsSecurityGroup
        };
    }
}