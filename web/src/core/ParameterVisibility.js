export function isParameterDefinitionVisible(definition, params = {}) {
  if (!definition) return false;

  if (definition.visibleWhen) {
    const rules = Array.isArray(definition.visibleWhen) ? definition.visibleWhen : [definition.visibleWhen];
    return rules.every((rule) => {
      const actual = params[rule.param];
      if (Array.isArray(rule.value)) return rule.value.includes(actual);
      return actual === rule.value;
    });
  }

  if (definition.appliesTo && definition.appliesTo.length > 0) {
    return definition.appliesTo.includes(params.constructionMode);
  }

  return true;
}

export function getVisibleParameterDefinitions(definitions, params = {}) {
  return (definitions || []).filter((definition) => isParameterDefinitionVisible(definition, params));
}
