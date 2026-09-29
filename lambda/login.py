import json
import boto3
import jwt
import os
from argon2 import PasswordHasher
from datetime import datetime, timedelta, timezone

dynamodb = boto3.resource("dynamodb")

table = dynamodb.Table("UserInfo")

# JWT secret comes from Lambda Environment Variable
SECRET_KEY = os.environ["docket_secret"]
ph = PasswordHasher()


def lambda_handler(event, context):

    try:

        body = json.loads(
            event.get("body", "{}")
        )

        Email = body.get(
            "Email",
            ""
        ).strip().lower()

        password = body.get(
            "password",
            ""
        )

        if not Email or not password:

            return {
                "statusCode": 400,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                },
                "body": json.dumps({
                    "message":
                        "Email and password are required."
                })
            }

        # Get user from DynamoDB
        response = table.get_item(
            Key={
                "Email": Email
            }
        )

        user = response.get(
            "Item"
        )

        # User doesn't exist
        if not user:

            return {
                "statusCode": 401,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                },
                "body": json.dumps({
                    "message":
                        "Email or password is incorrect."
                })
            }

        # Check password
        try:
            ph.verify(user.get("passwordHash", ""), password)
        except Exception:
            return {
                "statusCode": 401,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                },
                "body": json.dumps({
                    "message":
                        "Email or password is incorrect."
                })
            }


        # =====================================================
        # CREATE JWT
        # =====================================================

        now = datetime.now(
            timezone.utc
        )

        payload = {

            "sub":
                Email,

            "email":
                Email,

            "name":
                user.get(
                    "name",
                    ""
                ),

            "iat":
                now,

            "exp":
                now + timedelta(
                    hours=1
                )

        }

        token = jwt.encode(
            payload,
            SECRET_KEY,
            algorithm="HS256"
        )

        # =====================================================
        # RETURN JWT
        # =====================================================

        return {
            "statusCode": 200,

            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },

            "body": json.dumps({

                "message":
                    "Login successful.",

                "name":
                    user.get(
                        "name",
                        ""
                    ),

                "token":
                    token

            })
        }

    except Exception as e:

        print(
            "Error:",
            str(e)
        )

        return {
            "statusCode": 500,

            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },

            "body": json.dumps({
                "message":
                    "Internal server error."
            })
        }
