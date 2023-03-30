import Hapi from '@hapi/hapi';
import { jest } from '@jest/globals';

import AdminJSHapi from '../src/plugin.js';

jest.useFakeTimers();

describe('plugin', () => {
  describe('.AdminJSHapi', () => {
    it('returns an Hapi server instance when AdminJS instance given as an argument', () => {
      expect(AdminJSHapi.register).toBeInstanceOf(Hapi.Server);
    });
  });
});
