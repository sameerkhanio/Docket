import json
import os
import jwt

SECRET_KEY = os.environ["docket_secret"]


def lambda_handler(event, context):

    try:
        token = event.get("authorizationToken", "")

        if not token.startswith("Bearer "):
            raise Exception("Missing Bearer token")

        token = token.split(" ", 1)[1]

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=["HS256"]
        )

        return {
            "principalId": payload.get("email", "user"),
            "policyDocument": {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "execute-api:Invoke",
                        "Effect": "Allow",
                        "Resource": event["methodArn"]
                    }
                ]
            }
        }

    except Exception as e:

        print("JWT verification failed:", str(e))

        return {
            "principalId": "unauthorized",
            "policyDocument": {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "execute-api:Invoke",
                        "Effect": "Deny",
                        "Resource": event["methodArn"]
                    }
                ]
            }
        }

