Files in this directory wrap yjs documents and fragments.

By the nature of yjs, these types can be mutated arbitrarily externally, so all getters must be treated as potentially unsafe.

Safety assumptions (referenced in code comments):

1.  Writes to yjs fragments are validated, so reads from yjs fragments should be valid. Assume no other sources are writing to these fragments.
2.  This fragment needs to be attached to a Y.Doc, or all reads to yjs fragments will be undefined. Assume callers are attaching fragments to a Y.Doc before reading from them.
