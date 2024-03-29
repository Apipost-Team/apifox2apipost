import { v4 as uuidV4 } from 'uuid';

const STATUS_NAME: any = {
  released: '已发布',
  testing: '测试中',
  deprecated: '将废弃',
  obsolete: '已废弃',
  exception: '有异常',
  tested: '已测完',
  pending: '待确定',
  integrating: '联调中',
  designing: '设计中',
}

const OPERATOR_FOX: any = {
  equal: {
    name: '等于',
    code: '.to.eql'
  },
  notEqual: {
    name: '不等于',
    code: '.to.not.eql'
  },
  exists: {
    name: '存在',
    code: '.to.have.deep.property'
  },
  notExists: {
    name: '不存在',
    code: '.to.not.have.deep.property'
  },
  match: {
    name: '正则匹配',
    code: '.to.match'
  },
  include: {
    name: '包含',
    code: '.to.include'
  },
  notInclude: {
    name: '不包含',
    code: '.to.not.include'
  },
  isOneOf: {
    name: '属于集合',
    code: '.to.be.oneOf'
  },
  isNotOneOf: {
    name: '不属于集合',
    code: '.to.not.be.oneOf'
  },
  isBelow: {
    name: '小于',
    code: '.to.be.below'
  },
  isAtMost: {
    name: '小于或等于',
    code: '.to.be.at.most'
  },
  isAbove: {
    name: '大于',
    code: '.to.be.above'
  },
  isAtLeast: {
    name: '大于或等于',
    code: '.to.be.at.least'
  },
  isEmpty: {
    name: '为空',
    code: '.to.be.empty'
  },
  isNotEmpty: {
    name: '不为空',
    code: '.to.not.be.empty'
  },
}

const BODY_TYPE: any = {
  'application/x-www-form-urlencoded': 'urlencoded',
  'application/xml': 'xml',
  'multipart/form-data': 'form-data',
  'text/plain': 'plain',
  none: 'none',
}
const joinCookieValues = (cookieArray: any) => {
  const filteredCookieArray = cookieArray.filter((cookie: any) => cookie.name);
  const cookieStringArray = filteredCookieArray.map((cookie: any) => `${cookie.name}=${cookie?.example}`);
  return cookieStringArray.join('; ');
}
const apifoxSchema2apipostSchema = (schemaObj: any) => {
  let jsonSchema: any = {};
  try {
    // x-apifox-orders 2 APIPOST_ORDERS x-apifox-refs 2 APIPOST_REFS  $ref 2 ref  x-apifox-overrides 2 APIPOST_OVERRIDES
    let jsonSchemaStr = JSON.stringify(schemaObj);
    // 替换 x-apifox-orders 为 APIPOST_ORDERS
    jsonSchemaStr = jsonSchemaStr.replace(/\"x-apifox-orders\"/g, '\"APIPOST_ORDERS\"');
    // 替换 x-apifox-refs 为 APIPOST_REFS
    jsonSchemaStr = jsonSchemaStr.replace(/\"x-apifox-refs\"/g, '\"APIPOST_REFS\"');
    // 替换 $ref 为 ref
    jsonSchemaStr = jsonSchemaStr.replace(/\"\$ref\"/g, '\"ref\"');
    // 替换 x-apifox-overrides 为 APIPOST_OVERRIDES
    jsonSchemaStr = jsonSchemaStr.replace(/\"x-apifox-overrides\"/g, '\"APIPOST_OVERRIDES\"');
    // 还原为对象
    jsonSchema = JSON.parse(jsonSchemaStr);

    if (jsonSchema.hasOwnProperty('ref')) {
      let newIuid = uuidV4();
      jsonSchema['APIPOST_REFS'] = {
        [newIuid]: {
          ref: jsonSchema.ref
        },
      };
      jsonSchema['APIPOST_ORDERS'] = [newIuid]
      jsonSchema['type'] = "object";
      jsonSchema['properties'] = {};

    }
  } catch (error) { }

  return jsonSchema;
}
const hasOtherProperties = (obj: any, excludedProperty: string) => {
  const filteredKeys = Object.keys(obj).filter(key => key !== excludedProperty);
  return filteredKeys.length > 0;
}
const isObject = (data: any) => {
  return Object.prototype.toString.call(data) === '[object Object]';
}
const isArray = (data: any) => {
  return Object.prototype.toString.call(data) === '[object Array]';
}
const isString = (data: any) => {
  return Object.prototype.toString.call(data) === '[object String]';
}
const getAssertKey = (subject: string, path: string, comparison: any, jsonArrayValueIndex: any) => {
  if (subject == 'responseText') {
    return 'apt.response.raw.responseText';
  } else if (subject == 'responseJson') {
    let safePath = path || '';
    if (safePath[0] === '$') {
      safePath = safePath.slice(1);
    }
    safePath = '.' + safePath.replace(/^\./, '');
    if (['exists', 'notExists'].includes(comparison)) {
      return `apt.response.json`;
    }
    if (jsonArrayValueIndex != null) {
      safePath = safePath + `[${jsonArrayValueIndex}]`
    }
    return `apt.response.json${safePath}`
  } else if (subject == 'responseXml') {
    return '';
  } else if (subject == 'responseHeader') {
    return `apt.response.resHeaders?.["${path}"]`;
  } else if (subject == 'responseCookie') {
    return `apt.response.cookies?.["${path}"]`;
  } else if (subject == 'environment') {
    return `apt.environment.get("${path}")`;
  } else if (subject == 'globals') {
    return `apt.globals.get("${path}")`;
  } else if (subject == 'duration') {
    return `apt.response.responseTime`;
  } else {
    return '';
  }
}
const getValueCode = (comparison: any, assertValue: any, path: any, multipleValue: any, jsonArrayValueIndex: any) => {
  let result = {
    valueCode: '',
    isNumber: false
  };
  if (['isEmpty', 'isNotEmpty'].includes(comparison)) {
    result.valueCode = '';
  } else if (['exists', 'notExists'].includes(comparison)) {
    if (jsonArrayValueIndex != null) {
      result.valueCode = `(\"${path}[${jsonArrayValueIndex}])\"`;
    } else {
      result.valueCode = `(\"${path})\"`;
    }
  } else if (['isOneOf', 'isNotOneOf'].includes(comparison)) {
    result.valueCode = `(${multipleValue})`;
  } else if (['isBelow', 'isAtMost', 'isAbove', 'isAtLeast'].includes(comparison)) {
    result.valueCode = `(${assertValue})`;
    if (!isNaN(assertValue)) {
      result.isNumber = true
    }
  } else {
    if (!isNaN(assertValue)) {
      result.valueCode = `(${assertValue})`;
      result.isNumber = true
    } else {
      result.valueCode = `(\`${assertValue}\`)`;
    }
  }
  return result;
}
const createPostManAssert = (data: any) => {
  const { subject, comparison = '', value = '', name = '', path = '', multipleValue = [], extractSettings = {} } = data || {};
  const assertName = `${name || path || subject || ''} ${OPERATOR_FOX[comparison]?.name || '-'} ${value}`;
  const comparisonCode = OPERATOR_FOX[comparison]?.code || '';

  let jsonArrayValueIndex = null;
  if (isObject(extractSettings) && extractSettings?.expression == path && extractSettings?.continueExtractorSettings?.isContinueExtractValue === true) {
    jsonArrayValueIndex = extractSettings?.continueExtractorSettings?.JsonArrayValueIndexValue || 0;
  }
  const key = getAssertKey(subject, path, comparison, jsonArrayValueIndex);

  if (!key) {
    return '';
  }

  const {
    valueCode,
    isNumber
  } = getValueCode(comparison, value, path, multipleValue, jsonArrayValueIndex);
  const keyCode = isNumber ? `parseInt(${key})` : key;
  return `apt.test("${assertName}", () => {
    apt.expect(${keyCode})${comparisonCode}${valueCode};
  });`
};
class Apifox2Apipost {
  version: string;
  project: any;
  apis: any[];
  envs: any[];
  dataModel: any[];
  constructor() {
    this.version = '1.0';
    this.project = {};
    this.apis = [];
    this.envs = [];
    this.dataModel = [];
  }
  ConvertResult(status: string, message: string, data: any = '') {
    return {
      status,
      message,
      data
    }
  }
  validate(json: any) {
    if (json.hasOwnProperty('apifoxProject')) {
      if (json.apifoxProject !== '1.0.0') {
        return this.ConvertResult('error', 'Must contain a apifoxProject field 1.0');
      } else {
        this.version = '2.0';
      }
    }
    if (!json.hasOwnProperty('apifoxProject')) {
      return this.ConvertResult('error', 'Must contain a apifoxProject field 1.0');
    }

    if (!json.hasOwnProperty('info')) {
      return this.ConvertResult('error', 'Must contain an info object');
    }
    else {
      var info = json.info;
      if (!info || !info.name) {
        return this.ConvertResult('error', 'Must contain info.name');
      }
    }

    return this.ConvertResult('success', '');
  }
  handleInfo(json: any) {
    this.project.name = json?.info?.name || '新建项目';
    this.project.description = json?.info?.description || '';
    this.project.markList = [];
    this.project.script = {
      pre_script: '',
      test: '',
    };
    // 全局参数 
    if (Object.prototype.toString.call(json?.commonParameters) === '[object Object]' && json.commonParameters.hasOwnProperty('parameters')) {
      let parameters = json.commonParameters.parameters;
      // header
      if (Object.prototype.toString.call(parameters?.header) === '[object Array]') {
        this.project.header = [];
        for (const h of parameters.header) {
          this.project.header.push({
            is_checked: h?.defaultEnable ? '1' : "-1",
            type: 'Text',
            key: h?.name || '',
            value: h?.defaultValue || '',
            not_null: h?.required ? '1' : "-1",
            description: h?.description || '',
            field_type: "Text"
          })
        }
      }
      // query
      if (Object.prototype.toString.call(parameters?.query) === '[object Array]') {
        this.project.query = [];
        for (const q of parameters.query) {
          this.project.query.push({
            is_checked: q?.defaultEnable ? '1' : "-1",
            type: 'Text',
            key: q?.name || '',
            value: q?.defaultValue || '',
            not_null: q?.required ? '1' : "-1",
            description: q?.description || '',
            field_type: "Text"
          })
        }
      }
      // body
      if (Object.prototype.toString.call(parameters?.body) === '[object Array]') {
        this.project.body = [];
        for (const b of parameters.body) {
          this.project.body.push({
            is_checked: b?.defaultEnable ? '1' : "-1",
            type: 'Text',
            key: b?.name || '',
            value: b?.defaultValue || '',
            not_null: b?.required ? '1' : "-1",
            description: b?.description || '',
            field_type: "Text"
          })
        }
      }
    }
    // 全局变量 globalVars
    if (Object.prototype.toString.call(json?.globalVariables) === '[object Array]' && json.globalVariables.length > 0) {
      this.project.globalVars = {};
      for (const globalVariable of json.globalVariables) {
        if (globalVariable.hasOwnProperty('variables') && globalVariable.variables instanceof Array && globalVariable.variables.length > 0) {
          for (const variable of globalVariable.variables) {
            if (variable?.name) {
              this.project.globalVars[String(variable.name)] = variable?.value || variable?.initialValue || '';
            }
          }
        }
      };
    };
    // 全局脚本
    if (Object.prototype.toString.call(json?.commonScripts) === '[object Array]' && json.commonScripts.length > 0) {
      // for (const commonScript of json.commonScripts) {

      // }
      this.project.commonScripts = json.commonScripts;
    }
  }
  handleEnvs(json: any) {
    if (json.hasOwnProperty('environments') && json.environments instanceof Array && json.environments.length > 0) {
      let foxEnvs = json.environments;
      for (const foxEnv of foxEnvs) {
        let temp_env: any = {
          name: foxEnv?.name || '未命名环境',
          pre_url: foxEnv?.baseUrl || '',
          list: {},
        }
        if (foxEnv.hasOwnProperty('variables') && foxEnv.variables instanceof Array && foxEnv.variables.length > 0) {
          for (const variable of foxEnv.variables) {
            if (variable.hasOwnProperty('name')) {
              temp_env.list[String(variable.name)] = {
                current_value: variable?.value || '',
                description: variable?.description || '',
                value: variable?.initialValue || '',
              };
            }
          }
        }
        this.envs.push(temp_env);

        if (isObject(foxEnv?.baseUrls) && hasOtherProperties(foxEnv.baseUrls, 'default') && isArray(json?.projectSetting?.servers)) {
          const servers = json?.projectSetting?.servers;
          Object.keys(foxEnv.baseUrls).forEach(key => {
            const baseUrl = foxEnv.baseUrls[key];
            const serverObj = servers.find((ser: any) => ser?.id == key)
            if (key != 'default' && baseUrl && serverObj && isString(serverObj?.name) && serverObj.name.length > 0) {
              this.envs.push({
                name: `${foxEnv?.name || "未命名环境"}-${serverObj.name}`,
                pre_url: baseUrl || '',
                list: temp_env?.list || {},
              })
            }
          })
        }
      }
    }
  }
  createNewCase(caseItem: any, api: any) {
    var newCase: any = {
      name: caseItem.name || '新建示例',
      target_type: 'sample',
      url: caseItem?.path || api?.url || "",
      method: api.method.toUpperCase() || 'GET',
      request: {
        'query': [],
        'header': [],
        'description': api.description || '',
        event: {
          pre_script: '',
          test: '',
        }
      },
      mark: api?.status || 'developing',
    }
    const { request } = newCase;
    if (Object.prototype.toString.call(caseItem?.parameters) === '[object Object]') {
      for (const key in caseItem.parameters) {
        let item = caseItem.parameters[key];
        if (key == 'query') {
          for (const p of item) {
            p.name && request.query.push({
              is_checked: "1",
              type: 'Text',
              key: p.name,
              value: p?.value || p?.sampleValue || p?.example || '',
              not_null: p?.required ? '1' : "-1",
              description: p.description || '',
              field_type: "Text"
            });
          }
        } else if (key == 'header') {
          for (const p of item) {
            p.name && request.header.push({
              is_checked: "1",
              type: 'Text',
              key: p.name,
              value: p?.value || p.sampleValue || p?.example || '',
              not_null: p?.required ? '1' : "-1",
              description: p.description || '',
              field_type: "Text"
            });
          }
        } else if (key == 'cookie') {
          // cookie
          if (Object.prototype.toString.call(item) === '[object Array]' && item.length > 0) {
            let cookies = joinCookieValues(item);
            const cookieHeader = request.header.find((item: any) => {
              return String(item?.key || '').toLowerCase() == 'cookie'
            })
            if (cookieHeader == undefined) {
              request.header.push({
                is_checked: '1',
                type: 'Text',
                key: 'cookie',
                value: cookies,
                not_null: '1',
                description: '',
                field_type: "Text"
              })
            } else {
              cookieHeader.value = cookieHeader.value + '; ' + cookies
            }
          }
        }
      }
    }
    if (caseItem.hasOwnProperty('auth')) {
      // 全证
      let apiPostAuth = {
        type: 'noauth',
        kv: {
          key: '',
          value: '',
        },
        bearer: {
          key: ''
        },
        basic: {
          username: '',
          password: ''
        }
      }
      const { auth } = caseItem;
      if (auth) {
        let type = auth['type'] || 'noauth';
        let apikey = auth['apikey'];
        let bearer = auth['bearer'];
        let basic = auth['basic'];
        switch (type) {
          case 'apikey':
            type = 'kv';
            break;
          case 'bearer':
            type = 'bearer';
            break;
          case 'basic':
            type = 'basic';
            break;
          default:
            type = 'noauth';
            break;
        }
        apiPostAuth.type = type;
        if (apikey) {
          apiPostAuth.kv = {
            key: apikey['key'] || '',
            value: apikey['value'] || ''
          }
        }
        if (bearer) {
          apiPostAuth.bearer = {
            key: bearer['token'] || '',
          }
        }
        if (basic) {
          apiPostAuth.basic = {
            username: basic['username'] || '',
            password: basic['password'] || ''
          }
        }
        request['auth'] = apiPostAuth;
      }
    }
    if (Object.prototype.toString.call(caseItem?.requestBody) === '[object Object]') {
      let bodyType = caseItem.requestBody['type'];
      request.body = {
        "mode": "none",
        "parameter": [],
        "raw": '',
        "raw_para": []
      }
      request.body.mode = BODY_TYPE?.[bodyType] || 'json';
      if (bodyType == 'application/x-www-form-urlencoded') {
        if (caseItem.requestBody.hasOwnProperty('parameters') && caseItem.requestBody.parameters instanceof Array) {
          caseItem.requestBody.parameters.forEach((param: any) => {
            param.name && request.body.parameter.push(
              {
                is_checked: "1",
                type: 'Text',
                key: param.name || "",
                value: param?.value || param.sampleValue || param.example || "",
                not_null: param?.required ? '1' : "-1",
                description: param.description || "",
                field_type: "Text"
              })
          });
        }
      } else if (bodyType == 'multipart/form-data') {
        if (caseItem.requestBody.hasOwnProperty('parameters') && caseItem.requestBody.parameters instanceof Array) {
          caseItem.requestBody.parameters.forEach((param: any) => {
            param.name && request.body.parameter.push(
              {
                is_checked: "1",
                type: param['type'] && param['type'] == 'file' ? 'File' : 'Text',
                key: param.name || "",
                value: param?.value || param.sampleValue || param.example || "",
                not_null: param?.required ? '1' : "-1",
                description: param.description || "",
                field_type: "Text"
              })
          });
        }
      } else if (bodyType == 'none') {
      } else {
        request.body.raw = caseItem?.requestBody?.data || caseItem.requestBody.sampleValue || caseItem.requestBody.example || '';
        if ((caseItem.requestBody.hasOwnProperty('jsonSchema')) && Object.prototype.toString.call(caseItem?.requestBody?.jsonSchema) === '[object Object]') {
          request.body.raw_schema = apifoxSchema2apipostSchema(caseItem.requestBody.jsonSchema);
        }
      }
    }
    // 前置执行脚本
    if (caseItem.hasOwnProperty('preProcessors') && caseItem.preProcessors instanceof Array) {
      request.event.pre_script = this.handlePreProcessors(caseItem.preProcessors);
    }
    // 后执行脚本
    if (caseItem.hasOwnProperty('postProcessors') && caseItem.postProcessors instanceof Array) {
      request.event.test = this.handlePreProcessors(caseItem.postProcessors);
    }
    return newCase;
  }
  createNewApi(item: any) {
    const { api: foxApi } = item;
    let status = foxApi?.status;

    // 在对应模型上 并且未存入项目markList中
    if (STATUS_NAME.hasOwnProperty(status) && this.project.markList.findIndex((item: any) => item?.key === status) === -1) {
      this.project.markList.push({
        key: status,
        name: STATUS_NAME[status],
      })
    };

    var api: any = {
      name: item.name || '新建接口',
      target_type: 'api',
      url: foxApi.path || "",
      method: foxApi.method.toUpperCase() || 'GET',
      request: {
        'query': [],
        'header': [],
        'description': foxApi.description || '',
        event: {
          pre_script: '',
          test: '',
        }
      },
      response: {},
      mark: status || 'developing',
    }
    const { request, response } = api;
    if (Object.prototype.toString.call(foxApi?.parameters) === '[object Object]') {
      for (const key in foxApi.parameters) {
        let item = foxApi.parameters[key];
        if (key == 'query') {
          for (const p of item) {
            p.name && request.query.push({
              is_checked: "1",
              type: 'Text',
              key: p.name,
              value: p?.value || p?.sampleValue || p?.example || '',
              not_null: p?.required ? '1' : "-1",
              description: p.description || '',
              field_type: "Text"
            });
          }
        } else if (key == 'header') {
          for (const p of item) {
            p.name && request.header.push({
              is_checked: "1",
              type: 'Text',
              key: p.name,
              value: p?.value || p.sampleValue || p?.example || '',
              not_null: p?.required ? '1' : "-1",
              description: p.description || '',
              field_type: "Text"
            });
          }
        } else if (key == 'cookie') {
          // cookie
          if (Object.prototype.toString.call(item) === '[object Array]' && item.length > 0) {
            let cookies = joinCookieValues(item);
            const cookieHeader = request.header.find((item: any) => {
              return String(item?.key || '').toLowerCase() == 'cookie'
            })
            if (cookieHeader == undefined) {
              request.header.push({
                is_checked: '1',
                type: 'Text',
                key: 'cookie',
                value: cookies,
                not_null: '1',
                description: '',
                field_type: "Text"
              })
            } else {
              cookieHeader.value = cookieHeader.value + '; ' + cookies
            }
          }
        }
      }
    }

    if (foxApi.hasOwnProperty('auth')) {
      // 全证
      let apiPostAuth = {
        type: 'noauth',
        kv: {
          key: '',
          value: '',
        },
        bearer: {
          key: ''
        },
        basic: {
          username: '',
          password: ''
        }
      }
      const { auth } = foxApi;
      if (auth) {
        let type = auth['type'] || 'noauth';
        let apikey = auth['apikey'];
        let bearer = auth['bearer'];
        let basic = auth['basic'];
        switch (type) {
          case 'apikey':
            type = 'kv';
            break;
          case 'bearer':
            type = 'bearer';
            break;
          case 'basic':
            type = 'basic';
            break;
          default:
            type = 'noauth';
            break;
        }
        apiPostAuth.type = type;
        if (apikey) {
          apiPostAuth.kv = {
            key: apikey['key'] || '',
            value: apikey['value'] || ''
          }
        }
        if (bearer) {
          apiPostAuth.bearer = {
            key: bearer['token'] || '',
          }
        }
        if (basic) {
          apiPostAuth.basic = {
            username: basic['username'] || '',
            password: basic['password'] || ''
          }
        }
        request['auth'] = apiPostAuth;
      }
    }
    if (Object.prototype.toString.call(foxApi?.requestBody) === '[object Object]') {
      let bodyType = foxApi.requestBody['type'];
      request.body = {
        "mode": "none",
        "parameter": [],
        "raw": '',
        "raw_para": []
      }
      request.body.mode = BODY_TYPE?.[bodyType] || 'json';
      if (bodyType == 'application/x-www-form-urlencoded') {
        if (foxApi.requestBody.hasOwnProperty('parameters') && foxApi.requestBody.parameters instanceof Array) {
          foxApi.requestBody.parameters.forEach((param: any) => {
            param.name && request.body.parameter.push(
              {
                is_checked: "1",
                type: 'Text',
                key: param.name || "",
                value: param?.value || param.sampleValue || param.example || "",
                not_null: param?.required ? '1' : "-1",
                description: param.description || "",
                field_type: "Text"
              })
          });
        }
      } else if (bodyType == 'multipart/form-data') {
        if (foxApi.requestBody.hasOwnProperty('parameters') && foxApi.requestBody.parameters instanceof Array) {
          foxApi.requestBody.parameters.forEach((param: any) => {
            param.name && request.body.parameter.push(
              {
                is_checked: "1",
                type: param['type'] && param['type'] == 'file' ? 'File' : 'Text',
                key: param.name || "",
                value: param?.value || param.sampleValue || param.example || "",
                not_null: param?.required ? '1' : "-1",
                description: param.description || "",
                field_type: "Text"
              })
          });
        }
      } else if (bodyType == 'none') {
      } else {
        request.body.raw = foxApi.requestBody.sampleValue || foxApi.requestBody.example || '';
        if ((foxApi.requestBody.hasOwnProperty('jsonSchema')) && Object.prototype.toString.call(foxApi?.requestBody?.jsonSchema) === '[object Object]') {
          request.body.raw_schema = apifoxSchema2apipostSchema(foxApi.requestBody.jsonSchema);
        }
      }
    }
    // 添加响应期望
    if (Object.prototype.toString.call(foxApi?.responses) === '[object Array]') {
      let responseExamples = [];
      if (Object.prototype.toString.call(foxApi?.responseExamples) === '[object Array]') {
        responseExamples = foxApi.responseExamples;
      }


      for (const item of foxApi.responses) {
        let id = item?.id;
        let newUUID = uuidV4();
        let jsonSchema = item?.jsonSchema;

        if (jsonSchema && Object.prototype.toString.call(jsonSchema) === '[object Object]') {
          jsonSchema = apifoxSchema2apipostSchema(jsonSchema);
        }
        if (item?.code == 200 && !response.hasOwnProperty('success')) {
          newUUID = 'success';
        } else if (item?.code == 404 && !response.hasOwnProperty('error')) {
          newUUID = 'error';
        }
        response[newUUID] = {
          expect: {
            name: item?.name || '新建响应示例',
            isDefault: newUUID == 'success' || newUUID == 'error' ? 1 : -1,
            code: item?.code || "",
            contentType: item?.contentType || "json",
            schema: jsonSchema,
            mock: "",
            verifyType: "schema",
          },
          raw: '',
          parameter: [],
        }
        let examples = responseExamples.filter((i: any) => i?.responseId == item?.id);
        if (Object.prototype.toString.call(examples) === '[object Array]' && examples.length > 0) {
          response[newUUID].raw = String(examples[0]?.data)
        }
      }
    }

    // 前置执行脚本
    if (foxApi.hasOwnProperty('preProcessors') && foxApi.preProcessors instanceof Array) {
      request.event.pre_script = this.handlePreProcessors(foxApi.preProcessors);
    }
    // 后执行脚本
    if (foxApi.hasOwnProperty('postProcessors') && foxApi.postProcessors instanceof Array) {
      request.event.test = this.handlePreProcessors(foxApi.postProcessors);
    }

    // 接口用例
    if (foxApi.hasOwnProperty('cases') && foxApi.cases instanceof Array && foxApi.cases.length > 0) {
      api.children = [];
      for (const foxCase of foxApi.cases) {
        if (Object.prototype.toString.call(foxCase) === '[object Object]') {
          api.children.push(this.createNewCase(foxCase, api));
        }
      }
    }

    return api;
  }
  handlePreProcessors(PreProcessors: any) {
    if (PreProcessors instanceof Array && PreProcessors.length > 0) {
      let script = '';
      for (const preProcessor of PreProcessors) {
        if (preProcessor?.type === 'customScript' && typeof preProcessor?.data === 'string' && preProcessor.data.trim().length > 0) {
          // 自定义脚本
          script = script + preProcessor.data.trim() + '\n';
        } else if (preProcessor?.type === 'commonScript' && preProcessor?.data instanceof Array && preProcessor.data.length > 0) {
          // 全局公共脚本
          script = script + this.handleCommonScript(preProcessor.data[0]);
        } else if (preProcessor?.type === 'assertion' && isObject(preProcessor?.data)) {
          // 断言处理
          const { data } = preProcessor || {};
     
          
          let newScript = createPostManAssert(data);
          if (isString(newScript) && newScript.length > 0) {
            script = `${script}\n${newScript}`;
          }
        }
      }
      return script;
    }
  }
  handleCommonScript(id: any) {
    if (this.project?.commonScripts instanceof Array) {
      let findItem = this.project.commonScripts.find((item: any) => item?.id == id)
      if (findItem && findItem != undefined && typeof findItem?.content === 'string') {
        return findItem?.content + '\n';
      }
    }
    return '';
  }
  createNewFolder(item: any) {
    var newFolder: any = {
      'name': item.name || '新建目录',
      'target_type': 'folder',
      'description': item.description || '',
      'request': {
        srcipt: {
          pre_script: '',
          test: '',
        }
      },
      'children': [],
    };
    const { request } = newFolder;
    // 目录认证
    if (item.hasOwnProperty('auth')) {
      // 认证
      const { auth } = item;
      let apiPostAuth = {
        type: 'noauth',
        kv: {
          key: '',
          value: '',
        },
        bearer: {
          key: ''
        },
        basic: {
          username: '',
          password: ''
        }
      }
      if (auth) {
        let type = auth['type'] || 'noauth';
        let apikey = auth['apikey'];
        let bearer = auth['bearer'];
        let basic = auth['basic'];
        switch (type) {
          case 'apikey':
            type = 'kv';
            break;
          case 'bearer':
            type = 'bearer';
            break;
          case 'basic':
            type = 'basic';
            break;
          default:
            type = 'noauth';
            break;
        }
        apiPostAuth.type = type;
        if (apikey) {
          apiPostAuth.kv = {
            key: apikey['key'] || '',
            value: apikey['value'] || ''
          }
        }
        if (bearer) {
          apiPostAuth.bearer = {
            key: bearer['token'] || '',
          }
        }
        if (basic) {
          apiPostAuth.basic = {
            username: basic['username'] || '',
            password: basic['password'] || ''
          }
        }
        request['auth'] = apiPostAuth;
      }
    }

    // 目录预执行脚本
    if (item.hasOwnProperty('preProcessors') && item.preProcessors instanceof Array && item.preProcessors.length > 0) {
      request.srcipt.pre_script = this.handlePreProcessors(item.preProcessors);
    }
    // 目录后执行脚本
    if (item.hasOwnProperty('postProcessors') && item.postProcessors instanceof Array && item.postProcessors.length > 0) {
      request.srcipt.test = this.handlePreProcessors(item.postProcessors);
    }
    return newFolder;
  }
  handleApiAndFolder(items: any[], parent: any = null) {
    var root = this;
    for (const item of items) {
      let target;
      if (item.hasOwnProperty('items') && !item.hasOwnProperty('api')) {
        target = root.createNewFolder(item);
        root.handleApiAndFolder(item.items, target);
      }
      if (item.hasOwnProperty('api')) {
        target = root.createNewApi(item);
      }
      if (parent && parent != null) {
        parent.children.push(target);
      } else {
        root.apis.push(target);
      }
    }
  }
  handleApiCollection(json: any) {
    if (!json.hasOwnProperty('apiCollection')) {
      return;
    }
    let apiCollection = json.apiCollection;
    if (apiCollection instanceof Array && apiCollection.length > 0) {
      if (apiCollection[0].hasOwnProperty('items')) {
        this.handleApiAndFolder(apiCollection[0].items, null);
      }
    }
  }
  createDataModelNewFolder(item: any) {
    var newFolder: any = {
      'model_id': item?.id || '',
      'name': item?.name || '新建目录',
      'model_type': 'folder',
      'description': item?.description || '',
      'children': [],
    };
    return newFolder;
  }
  createNewModelData(item: any) {
    const { name, displayName, description, schema, id } = item;
    var model: any = {
      model_id: id || '',
      name: name || '新建数据模型',
      displayName: displayName || '',
      model_type: 'model',
      description: description || '',
      schema: {},
    }
    try {
      let jsonSchema = schema?.jsonSchema;
      if (jsonSchema && Object.prototype.toString.call(jsonSchema) === '[object Object]') {
        model.schema = apifoxSchema2apipostSchema(jsonSchema);
      }
    } catch (error) { }
    return model;
  }
  handleModelApiAndFolder(items: any[], parent: any = null) {
    var root = this;
    for (const item of items) {
      let target;
      if (item.hasOwnProperty('items') && !item.hasOwnProperty('schema')) {
        target = root.createDataModelNewFolder(item);
        root.handleModelApiAndFolder(item.items, target);
      }
      if (item.hasOwnProperty('schema')) {
        target = root.createNewModelData(item);
      }
      if (parent && parent != null) {
        parent.children.push(target);
      } else {
        root.dataModel.push(target);
      }
    }
  }
  handleModelData(json: any) {
    if (json.hasOwnProperty('schemaCollection') && json.schemaCollection instanceof Array && json.schemaCollection.length > 0) {
      let rootData = json.schemaCollection[0];
      if (rootData?.items instanceof Array && rootData?.items.length > 0) {
        this.handleModelApiAndFolder(rootData.items, null);
      }
    }
  }
  convert(json: object) {
    var validationResult = this.validate(json);
    if (validationResult.status === 'error') {
      return validationResult;
    }
    this.handleInfo(json);
    this.handleEnvs(json);
    this.handleApiCollection(json);
    this.handleModelData(json);
    validationResult.data = {
      project: this.project,
      apis: this.apis,
      env: this.envs,
      dataModel: this.dataModel,
    }
    // console.log('project', JSON.stringify(validationResult.data.apis));
    return validationResult;
  }
}

export default Apifox2Apipost;
