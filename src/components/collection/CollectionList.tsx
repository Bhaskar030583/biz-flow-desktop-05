
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from 'date-fns';
import { CalendarIcon, Copy, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import CollectionForm from './CollectionForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CollectionList = () => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [hrStores, setHrStores] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    fetchCollections();
    fetchHrStores();
  }, [user]);

  const fetchCollections = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('credits')
        .select(`
          id,
          credit_date,
          amount,
          credit_type,
          hr_shop_id,
          hr_stores (store_name)
        `)
        .eq('user_id', user.id)
        .order('credit_date', { ascending: false });
      
      if (searchTerm) {
        query = query.ilike('description', `%${searchTerm}%`);
      }

      if (storeFilter) {
        query = query.eq('hr_shop_id', storeFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHrStores = async () => {
    try {
      const { data, error } = await supabase
        .from('hr_stores')
        .select('id, store_name');

      if (error) throw error;
      setHrStores(data || []);
    } catch (error) {
      console.error('Error fetching HR stores:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('credits')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchCollections();
      toast.success('Collection deleted successfully!');
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Failed to delete collection.');
    } finally {
      setIsDeleteModalOpen(false);
      setCollectionToDelete(null);
    }
  };

  const openDeleteModal = (id: string) => {
    setCollectionToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCollectionToDelete(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    fetchCollections();
  };

  const handleStoreFilterChange = (value: string) => {
    setStoreFilter(value);
    fetchCollections();
  };

  return (
    <div>
      <div className="flex flex-col space-y-2">
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <div className="relative w-full">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search collections..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          <div className="flex flex-1 gap-2">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="store">Store</Label>
              <Select value={storeFilter} onValueChange={handleStoreFilterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Stores" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="">All Stores</SelectItem>
                  {hrStores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.store_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <Table>
        <TableCaption>A list of your recent collections.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Mode</TableHead>
            <TableHead>Store</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">Loading collections...</TableCell>
            </TableRow>
          ) : collections.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">No collections found.</TableCell>
            </TableRow>
          ) : (
            collections.map((collection) => (
              <TableRow key={collection.id}>
                <TableCell>{format(new Date(collection.credit_date), 'PPP')}</TableCell>
                <TableCell>${collection.amount}</TableCell>
                <TableCell>{collection.credit_type}</TableCell>
                <TableCell>{collection.hr_stores?.store_name}</TableCell>
                <TableCell className="text-right font-medium">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(JSON.stringify(collection))}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => navigate(`/collection/${collection.id}`)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => openDeleteModal(collection.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Are you sure absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the collection from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={closeDeleteModal}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={() => handleDelete(collectionToDelete)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionList;
