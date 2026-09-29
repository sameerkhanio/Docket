import json
import boto3
import uuid
from datetime import datetime, timezone


dynamodb = boto3.resource('dynamodb')

table = dynamodb.Table('UserFiles')


def lambda_handler(event, context):

    try:

        # API Gateway se request body
        body = json.loads(event.get('body', '{}'))

        user_email = body.get('Email')
        user_name = body.get('UserName')
        content = body.get('content', '')


        # Basic validation
        if not user_email:
            return response(
                400,
                {
                    'message': 'Email is required.'
                }
            )


        if not user_name:
            return response(
                400,
                {
                    'message': 'UserName is required.'
                }
            )


        # New unique docket ID
        user_id = str(uuid.uuid4())


        # Current UTC time
        now = datetime.now(
            timezone.utc
        ).isoformat()


        # Save item to DynamoDB
        table.put_item(
            Item={

                'Email':
                    user_email,

                'id':
                    user_id,

                'UserName':
                    user_name,

                'content':
                    content,

                'createdAt':
                    now,

                'updatedAt':
                    now

            }
        )


        return response(
            201,
            {

                'message':
                    'Docket created successfully.',

                'docket': {

                    'Email':
                        user_email,

                    'id':
                        user_id,

                    'UserName':
                        user_name,

                    'content':
                        content,

                    'createdAt':
                        now,

                    'updatedAt':
                        now

                }

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
                'message':
                    'Could not create docket.'
            }
        )


def response(status_code, body):

    return {

        'statusCode':
            status_code,

        'headers': {

            'Content-Type':
                'application/json',

            'Access-Control-Allow-Origin':
                '*',

            'Access-Control-Allow-Headers':
                'Content-Type',

            'Access-Control-Allow-Methods':
                'POST,OPTIONS'

        },

        'body':
            json.dumps(body)

    }

