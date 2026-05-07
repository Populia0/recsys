def build_recommendations(rules):
    if not rules:
        return None
    
    recommendations = {}
    
    for rule in rules:
        attr = rule.get('attribute')
        value = rule.get('value')
        direction = rule.get('direction')
        
        if attr not in recommendations:
            recommendations[attr] = {'prefer': [], 'avoid': []}
        
        if direction == 'prefer':
            recommendations[attr]['prefer'].append(value)
        elif direction == 'avoid':
            recommendations[attr]['avoid'].append(value)
    
    result = {}
    for attr, values in recommendations.items():
        if values['prefer'] or values['avoid']:
            result[attr] = values
    
    return result if result else None