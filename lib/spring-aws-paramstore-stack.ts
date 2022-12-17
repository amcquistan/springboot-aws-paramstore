import { Aws, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from "aws-cdk-lib/aws-ssm";


export class SpringAwsParamstoreStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "VPC", {
      maxAzs: 2,
      natGateways: 1
    });
    const cluster = new ecs.Cluster(this, "cluster", { vpc });

    const firstNameParam = new ssm.StringParameter(this, 'FirstNameParam', {
      parameterName: "/config/awsparams-demo/author.first-name",
      stringValue: "adam"
    });
    const middleNameParam = new ssm.StringParameter(this, 'MiddleNameParam', {
      parameterName: "/config/awsparams-demo/author.middle-name",
      stringValue: "ENC(V/JV41F6DP4qCIOwQJNOR2+umiNJvfQdMZDv63OyY+ZTmMsQIkw5tm22wzE7Hj4L)"
    });

    const taskRole = new iam.Role(this, "TaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com")
    });
    taskRole.node.addDependency(firstNameParam, middleNameParam);
    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["ssm:GetParametersByPath"],
      resources: [
        `arn:aws:ssm:${Aws.REGION}:${Aws.ACCOUNT_ID}:parameter/config/awsparams-demo/*`,
        `arn:aws:ssm:${Aws.REGION}:${Aws.ACCOUNT_ID}:parameter/config/application/*`
      ]
    }));

    const fargateSvc = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "Fargate", {
      cluster,
      serviceName: "awsparams-demo",
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset("awsparams"),
        containerName: "app",
        containerPort: 8080,
        logDriver: ecs.LogDriver.awsLogs({
          logRetention: logs.RetentionDays.ONE_DAY,
          streamPrefix: "awsparams-demo"
        }),
        taskRole
      },
      taskSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
      }
    });

    fargateSvc.targetGroup.configureHealthCheck({ path: "/actuator/health" });

    new CfnOutput(this, "FirstNameParamEndpoint", {
      value: `http://${fargateSvc.loadBalancer.loadBalancerDnsName}/first-name`
    });

    new CfnOutput(this, "MiddleNameParamEndpoint", {
      value: `http://${fargateSvc.loadBalancer.loadBalancerDnsName}/middle-name`
    });
  }
}
