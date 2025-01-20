import { render } from '@testing-library/react';
import { ResourceTypeList } from './resource_type_list';
import { describe, it } from 'vitest';

describe('ResourceTypeList', () => {
    it("should render properly", () => {
        render(<ResourceTypeList resources={[]} />)
    })
});

