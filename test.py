
import urllib.request
import json

url_login = 'http://localhost:8080/api/auth/login'
data = json.dumps({'username': 'admin', 'password': 'admin123'}).encode('utf-8')
req = urllib.request.Request(url_login, data=data, headers={'Content-Type': 'application/json'})

with urllib.request.urlopen(req) as f:
    res = json.loads(f.read().decode('utf-8'))
    token = res.get('accessToken')

url_classes = 'http://localhost:8080/api/admin/data/classes'
req2 = urllib.request.Request(url_classes, headers={'Authorization': 'Bearer ' + token})
with urllib.request.urlopen(req2) as f2:
    with open('classes.json', 'wb') as out:
        out.write(f2.read())

