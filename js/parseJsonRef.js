function resolveRef(obj, root) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => resolveRef(item, root));
    }

    if (obj.$ref) {
        const refPath = obj.$ref.split('/').slice(1);
        let refValue = root;
        for (const part of refPath) {
            refValue = refValue[part];
        }
        return resolveRef(refValue, root);
    }

    const resolvedObj = {};
    for (const key in obj) {
        resolvedObj[key] = resolveRef(obj[key], root);
    }
    return resolvedObj;
}