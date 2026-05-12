# AWS IAM Role Configuration Fix

## Problem
The server is returning this error:
```json
{
  "success": false,
  "error": "Missing credentials in config, if using AWS_CONFIG_FILE, set AWS_SDK_LOAD_CONFIG=1"
}
```

Since you're using IAM roles, this indicates the role isn't being recognized by the AWS SDK.

## IAM Role Troubleshooting

### 1. Verify IAM Role is Attached

**For EC2 Instance:**
```bash
# Check if role is attached
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/

# Should return your role name, not 404
```

**For ECS Task:**
```bash
# Check task role in ECS task definition
aws ecs describe-task-definition --task-definition your-task-name
```

**For Lambda:**
```bash
# Check execution role
aws lambda get-function --function-name your-function-name
```

### 2. Verify IAM Role Permissions
Your IAM role needs these S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::your-resume-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::your-resume-bucket"
    }
  ]
}
```

### 3. Common IAM Role Issues

**Issue 1: Role Not Attached**
```bash
# For EC2 - attach role to instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-1234567890abcdef0 \
  --iam-instance-profile Name=YourInstanceProfile
```

**Issue 2: Trust Relationship Missing**
Ensure your role has the correct trust relationship:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

**Issue 3: AWS SDK Not Using Role**
In your backend code, ensure you're not overriding credentials:
```javascript
// ❌ Don't do this when using IAM roles
const s3 = new AWS.S3({
  accessKeyId: 'hardcoded-key',
  secretAccessKey: 'hardcoded-secret'
});

// ✅ Do this - let SDK use IAM role automatically
const s3 = new AWS.S3({
  region: 'us-east-1'
});
```

### 4. Quick Verification Commands

**Test IAM role access:**
```bash
# From your server, test S3 access
aws s3 ls

# Test specific bucket
aws s3 ls s3://your-resume-bucket/

# Test upload
echo "test" | aws s3 cp - s3://your-resume-bucket/test.txt
```

**Check current credentials:**
```bash
# See what credentials AWS SDK is using
aws sts get-caller-identity
```

### 5. Backend Code Check
Ensure your backend isn't trying to load credentials from files:

```javascript
// ❌ Remove these if present
process.env.AWS_CONFIG_FILE = '/path/to/config';
process.env.AWS_SHARED_CREDENTIALS_FILE = '/path/to/credentials';

// ✅ For IAM roles, only set region
process.env.AWS_REGION = 'us-east-1';

// ✅ Let AWS SDK auto-discover IAM role
const AWS = require('aws-sdk');
const s3 = new AWS.S3(); // No credentials needed
```

## Quick Fixes to Try

### Fix 1: Restart Application
Sometimes the application needs to be restarted after IAM role changes:
```bash
# Restart your application/container
sudo systemctl restart your-app
# or
docker restart your-container
```

### Fix 2: Check Instance Metadata Service
```bash
# Ensure IMDS is enabled and accessible
curl -v http://169.254.169.254/latest/meta-data/
```

### Fix 3: Verify Region Configuration
```bash
# Set AWS region if not set
export AWS_REGION=us-east-1
# or in your application
process.env.AWS_REGION = 'us-east-1';
```

## Debugging Steps

1. **Check IAM role attachment:**
   ```bash
   curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
   ```

2. **Verify role permissions:**
   ```bash
   aws iam get-role-policy --role-name YourRoleName --policy-name YourPolicyName
   ```

3. **Test S3 access:**
   ```bash
   aws s3 ls s3://your-bucket-name/
   ```

4. **Check application logs** for AWS SDK debug information

## Frontend Fallback
The frontend now includes a fallback mechanism that:
- ✅ Processes files locally when server upload fails
- ✅ Shows user-friendly messages about server issues
- ✅ Allows users to continue using the application
- ✅ Provides debug information for troubleshooting

Users will see a helpful message instead of technical errors while you fix the IAM role configuration.