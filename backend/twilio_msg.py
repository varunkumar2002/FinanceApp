import requests
from requests.auth import HTTPBasicAuth

url = "https://api.twilio.com/2010-04-01/Accounts/AC50da395e8ad7bc39939ad62aa6f4f15a/Messages.json"

payload = {
    "To": "+917569992080",
    "From": "+17372508034",
    "Body": "sms_account_alerts"
}

headers = {
    "Content-Type": "application/x-www-form-urlencoded"
}

# Twilio Account SID and Auth Token for Basic Authentication
auth = HTTPBasicAuth(
    "AC50da395e8ad7bc39939ad62aa6f4f15a",
    "f05a576f54f70b662dac8145a2d74c3b"
)

response = requests.post(url, data=payload, headers=headers, auth=auth)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")