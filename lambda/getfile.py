import json
import boto3
from boto3.dynamodb.conditions import Key


dynamodb = boto3.resource('dynamodb')

table = dynamodb.Table('UserFiles')


def lambda_handler(event, context):

    try:

        query_params = event.get('queryStringParameters') or {}

        user_email = query_params.get('Email')


        if not user_email:

            return response(
                400,
                {
                    'message': 'Email is required.'
                }
            )


        result = table.query(
            KeyConditionExpression=Key('Email').eq(user_email)
        )


        items = result.get(
            'Items',
            []
        )


        items.sort(
            key=lambda item:
                item.get(
                    'updatedAt',
                    item.get(
                        'createdAt',
                        ''
                    )
                ),
            reverse=True
        )


        return response(
            200,
            {
                'files': items
            }
        )


    except Exception as e:

        print(
            'ERROR:',
            str(e)
        )

        return response(
            500,
            {
                'message': 'Could not load files.'
            }
        )


def response(status_code, body):

    return {

        'statusCode': status_code,

        'headers': {

            'Content-Type':
                'application/json',

            'Access-Control-Allow-Origin':
                '*',

            'Access-Control-Allow-Headers':
                'Content-Type,Authorization',

            'Access-Control-Allow-Methods':
                'GET,POST,PUT,DELETE,OPTIONS'

        },

        'body':
            json.dumps(body)

    }
