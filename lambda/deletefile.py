import json
import boto3


dynamodb = boto3.resource('dynamodb')

table = dynamodb.Table('UserFiles')


def lambda_handler(event, context):

    try:

        body = json.loads(
            event.get('body', '{}')
        )

        user_email = body.get('Email')
        docket_id = body.get('id')


        if not user_email:

            return response(
                400,
                {
                    'message':
                        'Email is required.'
                }
            )


        if not docket_id:

            return response(
                400,
                {
                    'message':
                        'id is required.'
                }
            )


        result = table.delete_item(

            Key={

                'Email':
                    user_email,

                'id':
                    docket_id

            },

            ConditionExpression=
                'attribute_exists(Email) AND '
                'attribute_exists(id)',

            ReturnValues='ALL_OLD'

        )


        return response(
            200,
            {
                'message':
                    'Docket deleted successfully.',

                'docket':
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
                    'Docket not found.'
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
                    'Could not delete docket.'
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
                'DELETE,OPTIONS'

        },

        'body':
            json.dumps(body)

    }

