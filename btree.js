class BTreeNode {
    constructor(t, isLeaf = true) {
        this.t = t;
        this.keys = [];
        this.children = [];
        this.isLeaf = isLeaf;
    }

    // Encontra o índice da primeira chave maior ou igual a k
    findKey(k) {
        let idx = 0;
        while (idx < this.keys.length && this.keys[idx] < k) {
            idx++;
        }
        return idx;
    }

    // Insere uma nova chave k na subárvore enraizada neste nó
    insertNonFull(k) {
        let i = this.keys.length - 1;

        if (this.isLeaf) {
            // Insere a nova chave na posição correta na folha
            this.keys.push(null);
            while (i >= 0 && this.keys[i] > k) {
                this.keys[i + 1] = this.keys[i];
                i--;
            }
            this.keys[i + 1] = k;
        } else {
            // Encontra o filho que deve receber a nova chave
            while (i >= 0 && this.keys[i] > k) {
                i--;
            }
            i++;

            if (this.children[i].keys.length == 2 * this.t - 1) {
                this.splitChild(i, this.children[i]);

                if (this.keys[i] < k) {
                    i++;
                }
            }
            this.children[i].insertNonFull(k);
        }
    }

    // Divide o filho y deste nó
    splitChild(i, y) {
        const z = new BTreeNode(y.t, y.isLeaf);
        z.keys = y.keys.splice(this.t - 1);
        if (!y.isLeaf) {
            z.children = y.children.splice(this.t);
        }

        this.children.splice(i + 1, 0, z);
        this.keys.splice(i, 0, y.keys.pop());
    }

    // Remove a chave k da subárvore enraizada neste nó
    remove(k) {
        const idx = this.findKey(k);

        if (idx < this.keys.length && this.keys[idx] === k) {
            if (this.isLeaf) {
                this.removeFromLeaf(idx);
            } else {
                this.removeFromNonLeaf(idx);
            }
        } else {
            if (this.isLeaf) {
                console.log(`A chave ${k} não está na árvore.`);
                return;
            }

            const flag = (idx === this.keys.length);

            if (this.children[idx].keys.length < this.t) {
                this.fill(idx);
            }

            if (flag && idx > this.keys.length) {
                this.children[idx - 1].remove(k);
            } else {
                this.children[idx].remove(k);
            }
        }
    }

    removeFromLeaf(idx) {
        this.keys.splice(idx, 1);
    }

    removeFromNonLeaf(idx) {
        const k = this.keys[idx];

        if (this.children[idx].keys.length >= this.t) {
            const pred = this.getPredecessor(idx);
            this.keys[idx] = pred;
            this.children[idx].remove(pred);
        } else if (this.children[idx + 1].keys.length >= this.t) {
            const succ = this.getSuccessor(idx);
            this.keys[idx] = succ;
            this.children[idx + 1].remove(succ);
        } else {
            this.merge(idx);
            this.children[idx].remove(k);
        }
    }

    getPredecessor(idx) {
        let current = this.children[idx];
        while (!current.isLeaf) {
            current = current.children[current.keys.length];
        }
        return current.keys[current.keys.length - 1];
    }

    getSuccessor(idx) {
        let current = this.children[idx + 1];
        while (!current.isLeaf) {
            current = current.children[0];
        }
        return current.keys[0];
    }

    fill(idx) {
        if (idx !== 0 && this.children[idx - 1].keys.length >= this.t) {
            this.borrowFromPrev(idx);
        } else if (idx !== this.keys.length && this.children[idx + 1].keys.length >= this.t) {
            this.borrowFromNext(idx);
        } else {
            if (idx !== this.keys.length) {
                this.merge(idx);
            } else {
                this.merge(idx - 1);
            }
        }
    }

    borrowFromPrev(idx) {
        const child = this.children[idx];
        const sibling = this.children[idx - 1];

        child.keys.unshift(this.keys[idx - 1]);

        if (!child.isLeaf) {
            child.children.unshift(sibling.children.pop());
        }

        this.keys[idx - 1] = sibling.keys.pop();
    }

    borrowFromNext(idx) {
        const child = this.children[idx];
        const sibling = this.children[idx + 1];

        child.keys.push(this.keys[idx]);

        if (!child.isLeaf) {
            child.children.push(sibling.children.shift());
        }

        this.keys[idx] = sibling.keys.shift();
    }

    merge(idx) {
        const child = this.children[idx];
        const sibling = this.children[idx + 1];

        child.keys.push(this.keys[idx]);
        child.keys.push(...sibling.keys);

        if (!child.isLeaf) {
            child.children.push(...sibling.children);
        }

        this.keys.splice(idx, 1);
        this.children.splice(idx + 1, 1);
    }
}

class BTree {
    constructor(t) {
        this.t = t;
        this.root = null;
    }

    insert(k) {
        if (this.root === null) {
            this.root = new BTreeNode(this.t, true);
            this.root.keys.push(k);
        } else {
            if (this.root.keys.length === 2 * this.t - 1) {
                const s = new BTreeNode(this.t, false);
                s.children.push(this.root);
                s.splitChild(0, this.root);
                let i = 0;
                if (s.keys[0] < k) {
                    i++;
                }
                s.children[i].insertNonFull(k);
                this.root = s;
            } else {
                this.root.insertNonFull(k);
            }
        }
    }

    remove(k) {
        if (!this.root) {
            console.log("A árvore está vazia");
            return;
        }

        this.root.remove(k);

        if (this.root.keys.length === 0) {
            if (this.root.isLeaf) {
                this.root = null;
            } else {
                this.root = this.root.children[0];
            }
        }
    }

    // Exibição da árvore (para fins de depuração)
    traverse() {
        if (this.root !== null) {
            this.root.traverse();
        }
    }
}

// Função de exibição para fins de depuração (não essencial)
BTreeNode.prototype.traverse = function() {
    console.log(this.keys);
    if (!this.isLeaf) {
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].traverse();
        }
    }
}

// Exemplo de uso
const btree = new BTree(3);

// Inserindo valores na árvore B
btree.insert(10);
btree.insert(20);
btree.insert(5);
btree.insert(6);
btree.insert(12);
btree.insert(30);
btree.insert(7);
btree.insert(17);

// Exibindo a árvore antes da remoção
console.log("Árvore B antes da remoção:");
btree.traverse();

// Removendo um valor existente
btree.remove(6);

// Exibindo a árvore após a remoção
console.log("Árvore B após a remoção de 6:");
btree.traverse();
