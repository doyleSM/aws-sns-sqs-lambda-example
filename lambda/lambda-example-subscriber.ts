import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';

export async function main(event: any): Promise<any> {
  console.log('event 👉', JSON.stringify(event, null, 2));

  // throw new Error('throwing an Error 💥');

    return {
        body: JSON.stringify(event, null, 2),
        statusCode: 200
    }
}
