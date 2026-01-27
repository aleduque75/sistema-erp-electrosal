import { Avatar, Box, Flex, Text } from '@chakra-ui/react';
import { Pessoa } from '@prisma/client';
import { useMemo } from 'react';

interface LogoPessoaProps {
  pessoa: Pessoa;
}

export function LogoPessoa({ pessoa }: LogoPessoaProps) {
  const imageUrl = useMemo(() => {
    if (!pessoa.logo) return '/logo-placeholder.png';
    if (pessoa.logo.startsWith('http')) return pessoa.logo;
    return `${process.env.NEXT_PUBLIC_API_URL}/${pessoa.logo}`;
  }, [pessoa.logo]);

  return (
    <Flex align="center">
      <Avatar src={imageUrl} />
      <Box ml={3}>
        <Text fontWeight="bold">{pessoa.nome}</Text>
        <Text color="gray.500" fontSize="sm">
          {pessoa.email}
        </Text>
      </Box>
    </Flex>
  );
}