import { render, screen } from '@testing-library/react';
import { ResourceTypeList } from '../../components/resource_types/resource_type_list';
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import { parseOpenAPI } from '../../state/openapi'
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar';
import { BrowserRouter } from 'react-router-dom';

describe('ResourceTypeList', () => {
    it("should render the correct number of links", async () => {
        const fileContents = fs.readFileSync('src/example_oas.json', 'utf8');
        const openAPI = await parseOpenAPI(fileContents);
        render(
        <BrowserRouter>
            <SidebarProvider>
                <ResourceTypeList resources={openAPI.resources()} />
            </SidebarProvider>
        </BrowserRouter>
        );

        expect(screen.getByText('publishers')).toBeInTheDocument();
        expect(screen.getByText('books')).toBeInTheDocument();
        expect(screen.getByText('book-editions')).toBeInTheDocument();
        expect(screen.getByText('isbns')).toBeInTheDocument();
        
    })
});

