import * as Types from '../types';
import fs from 'fs';
import path from 'path';
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from 'constructs';
import {
    Instance,
    InstanceType,
    MachineImage,
    Peer,
    Port,
    SecurityGroup,
    UserData,
    SubnetType,
    Vpc,
    KeyPair
} from 'aws-cdk-lib/aws-ec2';
import {
    Role,
    PolicyStatement,
    ServicePrincipal,
    ManagedPolicy
} from 'aws-cdk-lib/aws-iam';

export interface BastionStackProps extends StackProps {
    environment: Types.ENVIRONMENT;
    vpc: Vpc;
    instanceType: string;
    sshKeyName: string;
    sshWhitelistedCidr: string;
    bastionSG: SecurityGroup;
    ubuntuAmiSSMParam: string;
    rdsClusterIdentifier: string;
    rdsClusterUsername: string;
}

export interface BastionStackOutputs {
    bastionPubIp: string;
    bastionPublicDnsName: string;
}

export class BastionStack extends Stack {
    private readonly bastionIamRole;
    private readonly bastionHost;

    constructor(scope: Construct, id: string, props: BastionStackProps) {
        super(scope, id, props);

        // add SSH ingress for selected IPs
        props.bastionSG.addIngressRule(Peer.ipv4(props.sshWhitelistedCidr), Port.tcp(22), 'Allow SSH');

        // create IAM role and attach policies to allow RDS connections and SSM access
        this.bastionIamRole = new Role(this, 'BastionIamRole', {
            assumedBy: new ServicePrincipal('ec2.amazonaws.com')
        });
        this.bastionIamRole.addToPolicy(new PolicyStatement({
            actions: ['rds-db:connect'],
            resources: [
                `arn:aws:rds-db:${this.region}:${this.account}:${props.rdsClusterIdentifier}/${props.rdsClusterUsername}`
            ]
        }));
        this.bastionIamRole.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
        );

        // compute bastion's hostname
        const bastionHostName = `bastion-${props.environment}`;

        // add user-data to the bastion
        const userDataPath = path.resolve(__dirname, './scripts/bastion-init.sh');
        const userDataContent = fs.readFileSync(userDataPath, "utf-8");
        const userDataRendered = userDataContent.replace(/\${hostname}/g, bastionHostName);
        const userData = UserData.forLinux();
        userData.addCommands(...userDataRendered.split("\n"));

        // create the bastion host
        this.bastionHost = new Instance(this, 'BastionHost', {
            vpc: props.vpc,
            instanceType: new InstanceType(props.instanceType),
            machineImage: MachineImage.fromSsmParameter(props.ubuntuAmiSSMParam),
            vpcSubnets: { subnetType: SubnetType.PUBLIC },
            keyPair: KeyPair.fromKeyPairName(this, 'BastionSSHKeyPair', props.sshKeyName),
            securityGroup: props.bastionSG,
            role: this.bastionIamRole,
            userData: userData
        });
    }

    getOutputs(): BastionStackOutputs {
        return {
            bastionPubIp: this.bastionHost.instancePublicIp,
            bastionPublicDnsName: this.bastionHost.instancePublicDnsName,
        };
    }
}