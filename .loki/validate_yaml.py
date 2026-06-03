import yaml
with open('docker-compose.yaml') as f:
    d = yaml.safe_load(f)
print('OK services:', list(d['services'].keys()))
print('OK networks:', list(d.get('networks', {}).keys()))
print('OK volumes:', list(d.get('volumes', {}).keys()))
print('app env keys:', len(d['services']['app']['environment']))
