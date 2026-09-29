import json
import boto3
from argon2 import PasswordHasher

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("UserInfo")

ph = PasswordHasher()


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))

        name = body.get("Name", "").strip()
        email = body.get("Email", "").strip().lower()
        password = body.get("password", "")

        if not name or not email or not password:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                "body": json.dumps({
                    "message": "Name, Email and password are required."
                })
            }

        response = table.get_item(
            Key={
                "Email": email
            }
        )

        if "Item" in response:
            return {
                "statusCode": 409,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                "body": json.dumps({
                    "message": "An account with this Email already exists."
                })
            }

        password_hash = ph.hash(password)

        table.put_item(
            Item={
                "Email": email,
                "name": name,
                "passwordHash": password_hash
            }
        )

        return {
            "statusCode": 201,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "message": "Account created successfully.",
                "name": name
            })
        }

    except Exception as e:
        print("Error:", str(e))

        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "message": "Internal server error."
            })
        }
