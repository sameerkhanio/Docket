import json
import boto3
from datetime import datetime, timezone


dynamodb = boto3.resource('dynamodb')

table = dynamodb.Table('UserFiles')


def lambda_handler(event, context):

    try:

        body = json.loads(
            event.get('body', '{}')
        )

        user_email = body.get('Email')
        user_id = body.get('id')
        user_name = body.get('UserName')
        content = body.get('content')


        if not user_email:

            return response(
                400,
                {
                    'message':
                        'Email is required.'
                }
            )


        if not user_id:

            return response(
                400,
                {
                    'message':
                        'id is required.'
                }
            )


        if user_name is None:

            return response(
                400,
                {
                    'message':
                        'UserName is required.'
                }
            )


        if content is None:

            return response(
                400,
                {
                    'message':
                        'content is required.'
                }
            )


        now = datetime.now(
            timezone.utc
        ).isoformat()


        result = table.update_item(

            Key={

                'Email':
                    user_email,

                'id':
                    user_id

            },

            UpdateExpression="""
                SET UserName = :name,
                    content = :content,
                    updatedAt = :updatedAt
            """,

            ExpressionAttributeValues={

                ':name':
                    user_name,

                ':content':
                    content,

                ':updatedAt':
                    now

            },

            ConditionExpression=
                'attribute_exists(Email) AND '
                'attribute_exists(id)',

            ReturnValues='ALL_NEW'

        )


        return response(
            200,
            {
                'message':
                    'File updated successfully.',

                'File':
                    result.get(
                        'Attributes',
                        {}
                    )
            }
        )


    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:

        return response(
            404,
            {
                'message':
                    'File not found.'
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
                    'Could not update file.'
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
                'PUT,OPTIONS'

        },

        'body':
            json.dumps(body)

    }
