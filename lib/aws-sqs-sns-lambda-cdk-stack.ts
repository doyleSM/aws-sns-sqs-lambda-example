require('dotenv').config()

import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as path from 'path';

import { Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { Stack, StackProps, CfnOutput, App, Duration } from 'aws-cdk-lib';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';


export class AwsSqsSnsLambdaCdkStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'development'
    ) {
      console.error('you must set NODE_ENV to production or development');
    }
    console.log(`deploying ${process.env.NODE_ENV}`);
    this.createSqs();
  }

  private createSqs(): void {
    const queueName = `queue-example-${process.env.NODE_ENV}`;
    const queueDlqName = `queue-example-dlq-${process.env.NODE_ENV}`;
    const topicName = `topic-example-${process.env.NODE_ENV}`;

    const deadLetterQueue = new sqs.Queue(this, queueDlqName, {
      queueName: queueDlqName,
      retentionPeriod: Duration.days(14),
    });

    const queue = new sqs.Queue(this, queueName, {
      queueName: queueName,
      visibilityTimeout: Duration.minutes(5),
      deadLetterQueue: {
        maxReceiveCount: 10,
        queue: deadLetterQueue,
      },
    });

    const topic = new sns.Topic(this, topicName);

    topic.addSubscription(new subs.SqsSubscription(queue));

    const myLambda = new NodejsFunction(this, 'example-lambda', {
      memorySize: 1024,
      timeout: Duration.seconds(5),
      runtime: Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(__dirname, `/../lambda/lambda-example-subscriber.ts`),
    });


    // 👇 add sqs queue as event source for Lambda
    myLambda.addEventSource(
      new SqsEventSource(queue, {
        batchSize: 10,
      }),
    );

    new CfnOutput(this, 'snsTopicArn', {
      value: topic.topicArn,
      description: 'The arn of the SNS topic',
    });
  }
}