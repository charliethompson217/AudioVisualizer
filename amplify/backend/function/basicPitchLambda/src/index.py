import json
import boto3
import urllib3
from io import BytesIO

ec2 = boto3.client('ec2')

def handler(event, context):

    # lambda trigger for getting item from s3 bucket
    if 'Records' in event and 's3' in event['Records'][0]:
        s3 = boto3.client('s3')
        bucket_name = event['Records'][0]['s3']['bucket']['name']
        object_key = event['Records'][0]['s3']['object']['key']

        # Get the mp3 file from S3 bucket
        file_obj = s3.get_object(Bucket=bucket_name, Key=object_key)
        file_path = '/tmp/' + object_key
        with open(file_path, 'wb') as file:
            file.write(file_obj['Body'].read())

        # convert the file using the program running on ec2 instance
        instance_id = 'i-0d5b458d6b3d909d4'
        response = ec2.describe_instances(InstanceIds=[instance_id])
        state = response['Reservations'][0]['Instances'][0]['State']['Name']

        if state == 'stopped':
            ec2.start_instances(InstanceIds=[instance_id])
            waiter = ec2.get_waiter('instance_running')
            waiter.wait(InstanceIds=[instance_id])
        elif state == 'running':
            print("Instance is already running.")
        elif state == 'stopping':
                waiter = ec2.get_waiter('instance_stopped')
                ec2.start_instances(InstanceIds=[instance_id])
                waiter = ec2.get_waiter('instance_running')
                waiter.wait(InstanceIds=[instance_id])
        else:
            raise Exception(f"Unhandled instance state: {state}")


        print("Getting public IP address...")
        response = ec2.describe_instances(InstanceIds=[instance_id])
        public_ip = response['Reservations'][0]['Instances'][0]['PublicIpAddress']
        print(f"Public IP address: {public_ip}")


        print("Making request to Flask app...")
        http = urllib3.PoolManager()
        with open(file_path, 'rb') as f:
            file_bytes = f.read()
        response = http.request(
            'POST',
            f'http://{public_ip}:5000/convert',
            fields={'file': ('uploaded_file.mp3', file_bytes, 'audio/mpeg')}
        )
        print("Response status: ", response.status)
        
        print("Stopping instance...")
        ec2.stop_instances(InstanceIds=[instance_id])
        
        # Add the converted file to S3 bucket
        converted_file_path = '/tmp/converted_' + object_key.replace('.mp3', '.mid')
        with open(converted_file_path, 'wb') as file:
            file.write(response.data)

        print("Uploading converted file to S3 bucket...")
        s3.upload_file(
            converted_file_path,
            bucket_name,
            'converted/' + object_key.replace('.mp3', '.mid')
        )
        print("File uploaded successfully.")

        s3.delete_object(Bucket=bucket_name, Key=object_key)
        print("Original mp3 file deleted from S3.")



        return {
            'statusCode': 200,
            'body': json.dumps('File converted successfully.')
        }
    else:
        method = event['httpMethod']
        if method == 'POST':
            body = json.loads(event['body'])
            s3 = boto3.client('s3')
            bucket_name = 'song-upload-bucket'
            object_name = body.get('objectName')
            content_type = body.get('contentType')
            
            try:
                presigned_url = s3.generate_presigned_url('put_object', Params={'Bucket': bucket_name, 'Key': object_name, 'ContentType': content_type}, ExpiresIn=3600)
                return {
                    'statusCode': 200,
                    'headers': {
                        'Access-Control-Allow-Headers': '*',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
                    },
                    'body': json.dumps({'url': presigned_url})
                }
            
            except ValueError as ve:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Access-Control-Allow-Headers': '*',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
                    },
                    'body': json.dumps({'error': str(ve)})
                }
